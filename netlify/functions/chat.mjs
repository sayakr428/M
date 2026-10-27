// POST /api/chat — text chat with the Shantiban City assistant.
// Body: { messages: [{ role: "user" | "assistant", content: string }, ...] }
// Streams the reply as plain text. Answers come only from the knowledge
// document (the same one the voice agent uses), in the visitor's language.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { respond } from "../lib/db.mjs";

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
// Primary model, then a backup used when NVIDIA's free endpoint is slow.
const MODELS = (process.env.CHAT_MODELS || "nvidia/nemotron-3-ultra-550b-a55b,minimaxai/minimax-m3.1-flash").split(",");
// Netlify stops functions after 10s, so the first words must arrive well before that.
const DEADLINE_MS = 8500;
// If the primary model is silent this long, the backup is started in parallel.
const HEDGE_AFTER_MS = 2500;
const MAX_TURNS = 12;
const MAX_CHARS = 1000;

function loadKnowledge() {
  const rel = "netlify/knowledge/shantiban-knowledge.md";
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [path.join(process.cwd(), rel), path.join(here, "../knowledge/shantiban-knowledge.md"), path.join(here, rel)];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  throw new Error("Knowledge document not found");
}

const KNOWLEDGE = loadKnowledge();

const RULES = `You are the Shantiban City assistant, chatting with visitors on the project's website.

LANGUAGE
- Reply in the same language as the visitor's latest message: Bengali, Hindi or English.
- If the visitor writes Bengali or Hindi using English letters (for example "plot er dam koto?"), reply in that same language using English letters.
- Use natural, conversational Bengali and Hindi, not formal textbook language. Use simple Indian English.

STYLE
- Keep answers short: one to three sentences unless the visitor asks for detail.
- Plain text only: no markdown, headings, tables or emojis.

KNOWLEDGE
- You are the Shantiban City assistant. Never talk about yourself as an AI model, and never mention model names, NVIDIA or any technology company.
- If asked who you are, what your name is or who made you, say you are the Shantiban City assistant for MRITYIKA REALTERS OPC PRIVATE LIMITED.
- Answer only from the knowledge document below. It is your single source of truth.
- Follow every rule in the document, especially: never invent prices, plot details, availability, names or approvals; say "approximately" for distances; never present proposed facilities (like the proposed metro) as existing.
- If the answer is not in the document, say politely that you don't have that information.
- If asked about anything unrelated to Shantiban City, briefly say you can only help with Shantiban City.`;

const SYSTEM = `${RULES}\n\n<knowledge_document>\n${KNOWLEDGE}\n</knowledge_document>`;

function languageHint(text) {
  if (/[ঀ-৿]/.test(text)) return "The visitor just wrote in Bengali. Reply only in Bengali (Bengali script).";
  if (/[ऀ-ॿ]/.test(text)) return "The visitor just wrote in Hindi. Reply only in Hindi (Devanagari script).";
  return "Reply in the language of the visitor's latest message.";
}

function cleanHistory(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }));
  return msgs.length && msgs[msgs.length - 1].role === "user" ? msgs : null;
}

// Starts a streaming completion and waits for its first piece of text, so a
// slow model can be abandoned before anything is sent to the visitor.
async function startModel(model, messages, ctrl, timeoutMs) {
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(NVIDIA_URL, {
      method: "POST",
      signal: ctrl.signal,
      headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature: 0.3,
        max_tokens: 400,
        chat_template_kwargs: { enable_thinking: false },
      }),
    });
    if (!res.ok) throw new Error(`${model} HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    const pending = [];
    let done = false;

    const pull = async () => {
      const { value, done: end } = await reader.read();
      if (end) {
        done = true;
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        const data = line.startsWith("data:") ? line.slice(5).trim() : "";
        if (!data || data === "[DONE]") continue;
        try {
          const text = JSON.parse(data).choices?.[0]?.delta?.content;
          if (text) pending.push(text);
        } catch {
          // ignore keep-alive or partial lines
        }
      }
    };

    while (!pending.length && !done) await pull();
    clearTimeout(timer);
    if (!pending.length) throw new Error(`${model} returned no text`);
    return { pending, pull, isDone: () => done, cancel: () => ctrl.abort() };
  } catch (err) {
    clearTimeout(timer);
    ctrl.abort();
    throw err;
  }
}

// Runs the primary model; if it hasn't produced text after HEDGE_AFTER_MS (or
// fails), starts the next one too. The first to produce text wins and the
// others are cancelled.
function firstResponder(messages) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const ctrls = [];
    let next = 0, running = 0, settled = false, hedgeTimer = null;

    const launch = () => {
      if (settled || next >= MODELS.length) return;
      const model = MODELS[next++].trim();
      const ctrl = new AbortController();
      ctrls.push(ctrl);
      running++;
      startModel(model, messages, ctrl, Math.max(DEADLINE_MS - (Date.now() - started), 500)).then(
        (stream) => {
          if (settled) return stream.cancel();
          settled = true;
          clearTimeout(hedgeTimer);
          ctrls.forEach((c) => c !== ctrl && c.abort());
          resolve(stream);
        },
        (err) => {
          running--;
          if (!settled) console.warn("chat model failed:", err.message);
          launch();
          if (!settled && running === 0) {
            settled = true;
            clearTimeout(hedgeTimer);
            reject(new Error("all models failed"));
          }
        },
      );
    };

    launch();
    hedgeTimer = setTimeout(launch, HEDGE_AFTER_MS);
  });
}

export default async (req) => {
  if (req.method !== "POST") return respond(405, { error: "Method not allowed" }, { Allow: "POST" });

  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(req.url).host) return respond(403, { error: "Forbidden" });

  if (!process.env.NVIDIA_API_KEY) {
    console.error("NVIDIA_API_KEY is not configured");
    return respond(503, { error: "The assistant is not available right now." });
  }

  let history;
  try {
    history = cleanHistory((await req.json()).messages);
  } catch {
    history = null;
  }
  if (!history) return respond(400, { error: "Please type a question." });

  const messages = [
    { role: "system", content: SYSTEM },
    ...history,
    { role: "system", content: languageHint(history[history.length - 1].content) },
  ];

  let stream;
  try {
    stream = await firstResponder(messages);
  } catch {
    return respond(503, { error: "The assistant is busy right now. Please try again in a moment." });
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async pull(controller) {
      try {
        while (!stream.pending.length && !stream.isDone()) await stream.pull();
        if (stream.pending.length) controller.enqueue(encoder.encode(stream.pending.splice(0).join("")));
        else controller.close();
      } catch (err) {
        console.error("chat stream error:", err.message);
        controller.close();
      }
    },
    cancel() {
      stream.cancel();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
};

export const config = { path: "/api/chat" };
