import { readDb, setCaching, setCors } from "../_lib/ghs.js";
import { getProvidedApiKey, isValidApiKey } from "../_lib/api-key.js";
import { applyRateLimitHeaders, checkRateLimit, getRateLimitContext } from "../_lib/rate-limit.js";

function parseNumber(value) {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 260) return null;
  return n;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const n = parseNumber(req.query && (req.query.number ?? req.query.n));
  if (!n) return res.status(400).json({ error: "Invalid hymn number. Use ?number=1..260." });

  const providedKey = getProvidedApiKey(req);
  const hasFullAccess = isValidApiKey(providedKey);
  const { ip } = getRateLimitContext(req);
  const rl = await checkRateLimit({
    key: hasFullAccess ? `key:${providedKey}` : `ip:${ip}`,
    limit: hasFullAccess ? 120 : 10,
    windowSeconds: 60,
  });
  applyRateLimitHeaders(res, rl);
  // Don't cache rate-limited responses at the edge, or clients will bypass limits.
  res.setHeader("Cache-Control", "no-store");
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.resetSeconds));
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  try {
    const db = await readDb();
    const hymn = (db.hymns || []).find((h) => h && h.number === n);
    if (!hymn) return res.status(404).json({ error: `Hymn #${n} not found.` });

    return res.status(200).json(hymn);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to load hymn",
      detail: error && typeof error === "object" && "message" in error ? String(error.message) : String(error),
    });
  }
}
