// POST /api/enquiry — stores a website form submission in MongoDB.
// Fields: name, mobile, email, plot_type, message (+ created_at).
import { getDb, respond } from "../lib/db.mjs";

const LIMITS = { name: 100, mobile: 20, email: 200, plot_type: 50, message: 2000 };

function clean(value, max) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s ? s.slice(0, max) : null;
}

export default async (req) => {
  if (req.method !== "POST") return respond(405, { error: "Method not allowed" }, { Allow: "POST" });

  let body;
  try {
    const raw = await req.text();
    if (raw.length > 20000) throw new Error("Body too large");
    body = raw ? JSON.parse(raw) : {};
  } catch {
    return respond(400, { error: "Invalid request. Please try again." });
  }

  const doc = {};
  for (const [field, max] of Object.entries(LIMITS)) doc[field] = clean(body[field], max);

  if (!doc.name || !doc.mobile) {
    return respond(400, { error: "Share your name and a mobile number so we can reach you." });
  }
  if (doc.mobile.replace(/\D/g, "").length < 7) {
    return respond(400, { error: "Please enter a valid mobile number." });
  }
  if (doc.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doc.email)) {
    return respond(400, { error: "Please enter a valid email address." });
  }

  doc.created_at = new Date();

  try {
    const db = await getDb();
    await db.collection("contact_submissions").insertOne(doc);
  } catch (err) {
    console.error("MongoDB insert failed:", err);
    return respond(500, { error: "Could not submit form. Please try again." });
  }

  return respond(201, { ok: true });
};

export const config = { path: "/api/enquiry" };
