// Production server for Hostinger Node.js hosting: serves the static site and
// routes /api/<name> to netlify/functions/<name>.mjs (each exports
// (Request) => Response), so the same backend runs here and on Netlify.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import zlib from "node:zlib";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const FUNCTIONS_DIR = path.join(ROOT, "netlify", "functions");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".gif": "image/gif", ".svg": "image/svg+xml",
  ".ico": "image/x-icon", ".mp4": "video/mp4", ".webm": "video/webm", ".woff": "font/woff",
  ".woff2": "font/woff2", ".glb": "model/gltf-binary", ".pdf": "application/pdf",
};

// Server-side code and config are never served as files.
const PRIVATE = /^\/(netlify|node_modules|\.git)(\/|$)|^\/(server\.mjs|package(-lock)?\.json|netlify\.toml|\.env.*|\.gitignore|\.gitattributes)$/;

const handlers = new Map();
async function loadHandler(name) {
  if (!handlers.has(name)) {
    const file = path.join(FUNCTIONS_DIR, `${name}.mjs`);
    handlers.set(name, fs.existsSync(file) ? import(pathToFileURL(file).href).then((m) => m.default) : null);
  }
  return handlers.get(name);
}

async function handleApi(name, req, res, url) {
  const handler = await loadHandler(name);
  if (!handler) return send(res, 404, "Not found");

  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
  });

  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) return res.end();
  for await (const chunk of response.body) res.write(chunk); // chat replies stream word by word
  res.end();
}

function send(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function resolveFile(pathname) {
  let file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) return null;
  try {
    if (fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  } catch {
    if (fs.existsSync(`${file}.html`)) file = `${file}.html`;
  }
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function serveStatic(req, res, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return send(res, 400, "Bad request");
  }

  // Pages live at /about/ etc.; send /about to /about/ so relative links keep working.
  if (!pathname.endsWith("/") && !path.extname(pathname) && fs.existsSync(path.join(ROOT, pathname, "index.html"))) {
    res.writeHead(308, { Location: `${pathname}/${url.search}` });
    return res.end();
  }

  let status = 200;
  let file = PRIVATE.test(pathname) ? null : resolveFile(pathname);
  if (!file) {
    status = 404;
    file = path.join(ROOT, "404.html");
  }

  const stat = fs.statSync(file);
  const etag = `"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;
  const headers = {
    "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
    // Some script files keep their name when they change, so browsers must check
    // for a newer copy each visit; unchanged files come back as a quick 304.
    "Cache-Control": "public, max-age=0, must-revalidate",
    ETag: etag,
    "Last-Modified": stat.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
  };

  if (status === 200 && req.headers["if-none-match"] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }

  // Videos need range requests so browsers can seek and start playing quickly.
  const range = status === 200 && req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
    if (start >= stat.size || start > end) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, { ...headers, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(file, { start, end }).pipe(res);
  }

  // Pages, scripts and styles go out compressed (they shrink to roughly a fifth).
  const encoding = COMPRESSIBLE.test(file) && preferredEncoding(req.headers["accept-encoding"]);
  if (encoding) {
    const body = compressed(file, etag, encoding);
    res.writeHead(status, { ...headers, "Content-Encoding": encoding, "Content-Length": body.length, Vary: "Accept-Encoding" });
    return res.end(req.method === "HEAD" ? undefined : body);
  }

  res.writeHead(status, { ...headers, "Accept-Ranges": "bytes", "Content-Length": stat.size });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(file).pipe(res);
}

const COMPRESSIBLE = /\.(html|js|mjs|css|json|txt|xml|svg|md)$/i;
const compressedCache = new Map();

function preferredEncoding(accept = "") {
  if (/\bbr\b/.test(accept)) return "br";
  if (/\bgzip\b/.test(accept)) return "gzip";
  return null;
}

// Compressed once per file version, then served from memory.
function compressed(file, etag, encoding) {
  const key = `${encoding}:${file}:${etag}`;
  if (!compressedCache.has(key)) {
    const raw = fs.readFileSync(file);
    compressedCache.set(key, encoding === "br"
      ? zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } })
      : zlib.gzipSync(raw, { level: 9 }));
  }
  return compressedCache.get(key);
}

http
  .createServer(async (req, res) => {
    const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const url = new URL(req.url, `${proto}://${host}`);

    // One address for search engines: www.mrityikaestates.com -> mrityikaestates.com
    if (url.hostname.startsWith("www.")) {
      res.writeHead(301, { Location: `https://${url.hostname.slice(4)}${req.url}` });
      return res.end();
    }

    try {
      const api = url.pathname.match(/^\/api\/([a-z-]+)\/?$/);
      if (api) return await handleApi(api[1], req, res, url);
      if (!["GET", "HEAD"].includes(req.method)) return send(res, 405, "Method not allowed");
      serveStatic(req, res, url);
    } catch (err) {
      console.error(`${req.method} ${url.pathname} failed:`, err);
      if (!res.headersSent) send(res, 500, "Something went wrong.");
      else res.end();
    }
  })
  .listen(PORT, () => console.log(`Shantiban City site listening on port ${PORT}`));
