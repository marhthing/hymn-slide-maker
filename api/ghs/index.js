import { readDb, setCaching, setCors } from "../_lib/ghs.js";
import { getProvidedApiKey, isValidApiKey } from "../_lib/api-key.js";
import { applyRateLimitHeaders, checkRateLimit, getRateLimitContext } from "../_lib/rate-limit.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const providedKey = getProvidedApiKey(req);
  const hasFullAccess = isValidApiKey(providedKey);
  const { ip } = getRateLimitContext(req);
  const rl = await checkRateLimit({
    key: hasFullAccess ? `key:${providedKey}` : `ip:${ip}`,
    limit: hasFullAccess ? 520 : 260,
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
    const db = await readDb(req);
    return res.status(200).json({
      title: db.title,
      total: db.total,
      range: { min: 1, max: 252 },
      endpoints: {
        byNumber: "/api/ghs/by-number?number=16",
        search: "/api/ghs/search?q=...",
        raw: "/GHS-1-260.json",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to load GHS dataset",
      detail: error && typeof error === "object" && "message" in error ? String(error.message) : String(error),
    });
  }
}
