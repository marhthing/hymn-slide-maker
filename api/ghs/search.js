import { normalizeQuery, readDb, setCaching, setCors } from "../_lib/ghs.js";
import { getProvidedApiKey, isValidApiKey } from "../_lib/api-key.js";
import { applyRateLimitHeaders, checkRateLimit, getRateLimitContext } from "../_lib/rate-limit.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const q = normalizeQuery(req.query && req.query.q);
  if (!q) return res.status(400).json({ error: "Missing query parameter `q`." });

  const providedKey = getProvidedApiKey(req);
  const hasFullAccess = isValidApiKey(providedKey);
  const { ip } = getRateLimitContext(req);
  const rl = await checkRateLimit({
    key: hasFullAccess ? `key:${providedKey}` : `ip:${ip}`,
    limit: hasFullAccess ? 120 : 10,
    windowSeconds: 60,
  });
  applyRateLimitHeaders(res, rl);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.resetSeconds));
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  try {
    const db = await readDb(req);
    const needle = q.toLowerCase();
    const results = (db.hymns || [])
      .filter((h) => {
        if (!h) return false;
        if (String(h.number) === needle) return true;
        if (h.title && String(h.title).toLowerCase().includes(needle)) return true;
        if (h.chorus && String(h.chorus).toLowerCase().includes(needle)) return true;
        return Array.isArray(h.verses) && h.verses.some((v) => String(v.text || "").toLowerCase().includes(needle));
      })
      .slice(0, 20)
      .map((h) => ({ number: h.number, title: h.title }));

    setCaching(res, 60 * 10);
    return res.status(200).json({ q, count: results.length, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Search failed",
      detail: error && typeof error === "object" && "message" in error ? String(error.message) : String(error),
    });
  }
}
