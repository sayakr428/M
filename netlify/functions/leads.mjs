// GET /api/leads — password-protected list of form submissions.
// Browser prompts for login: any username, password = LEADS_PASSWORD env var.
// Add ?format=csv to download a spreadsheet.
import crypto from "node:crypto";
import { getDb, respond } from "../lib/db.mjs";

const COLUMNS = ["created_at", "name", "mobile", "email", "plot_type", "message"];

function authorized(req) {
  const expected = process.env.LEADS_PASSWORD;
  const header = req.headers.get("authorization") || "";
  if (!expected || !header.startsWith("Basic ")) return false;
  const decoded = Buffer.from(header.slice(6), "base64").toString();
  const given = decoded.slice(decoded.indexOf(":") + 1);
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function cell(row, col) {
  const v = row[col];
  if (v === null || v === undefined) return "";
  if (v instanceof Date) {
    return v.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  }
  return String(v);
}

const escHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const escCsv = (s) => {
  // Leading =,+,-,@ would be run as a formula by Excel/Sheets (phone numbers like "+91 ..." are fine).
  const safe = /^[=@]|^[+-](?![\d\s()-]+$)/.test(s) ? "'" + s : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export default async (req) => {
  if (req.method !== "GET") return respond(405, { error: "Method not allowed" });

  if (!process.env.LEADS_PASSWORD) return respond(500, "LEADS_PASSWORD is not configured.");
  if (!authorized(req)) {
    return respond(401, "Login required.", { "WWW-Authenticate": 'Basic realm="Shantiban City leads"' });
  }

  let rows;
  try {
    const db = await getDb();
    rows = await db.collection("contact_submissions").find().sort({ created_at: -1 }).toArray();
  } catch (err) {
    console.error("MongoDB read failed:", err);
    return respond(500, "Could not load leads.");
  }

  if (new URL(req.url).searchParams.get("format") === "csv") {
    const lines = [COLUMNS.join(",")].concat(rows.map((r) => COLUMNS.map((c) => escCsv(cell(r, c))).join(",")));
    return respond(200, "﻿" + lines.join("\r\n"), {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="shantiban-leads.csv"',
    });
  }

  const head = COLUMNS.map((c) => `<th>${c.replace("_", " ")}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${COLUMNS.map((c) => `<td>${escHtml(cell(r, c))}</td>`).join("")}</tr>`)
    .join("");

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Shantiban City Leads</title>
<style>
body{font:14px/1.5 system-ui,sans-serif;margin:0;padding:24px 16px;background:#f7f5ef;color:#14281d}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 16px;color:#4b5d52}
a.btn{display:inline-block;margin-bottom:16px;padding:8px 14px;background:#14532d;color:#fff;border-radius:6px;text-decoration:none}
.wrap{overflow-x:auto;background:#fff;border:1px solid #dcd8cc;border-radius:8px}
table{border-collapse:collapse;width:100%;min-width:720px}
th,td{padding:10px 12px;border-bottom:1px solid #ece9e0;text-align:left;vertical-align:top}
th{background:#eef2ea;text-transform:capitalize;font-weight:600;white-space:nowrap}
td:nth-child(1),td:nth-child(3){white-space:nowrap}td:last-child{max-width:420px;white-space:pre-wrap}
</style></head><body>
<h1>Shantiban City leads</h1><p>${rows.length} submission${rows.length === 1 ? "" : "s"}, newest first. Times in IST.</p>
<a class="btn" href="?format=csv">Download CSV</a>
<div class="wrap"><table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${COLUMNS.length}">No submissions yet.</td></tr>`}</tbody></table></div>
</body></html>`;
  return respond(200, html, { "Content-Type": "text/html; charset=utf-8" });
};

export const config = { path: "/api/leads" };
