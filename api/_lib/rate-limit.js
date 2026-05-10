function headerValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function getClientIp(req) {
  const xff = headerValue(req.headers["x-forwarded-for"]);
  if (xff) return String(xff).split(",")[0].trim();
  const realIp = headerValue(req.headers["x-real-ip"]);
  if (realIp) return String(realIp).trim();
  return "unknown";
}

function getRedisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function upstashFetch({ url, token }, path) {
  const response = await fetch(`${url}${path}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Upstash error (${response.status}): ${text || "no body"}`);
  }
  return response.json();
}

function clampSeconds(seconds) {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return 60;
  return Math.min(Math.max(1, Math.floor(n)), 60 * 60);
}

export function getRateLimitContext(req) {
  const ip = getClientIp(req);
  return { ip };
}

/**
 * Fixed-window limiter using Upstash Redis REST:
 * - INCR counter for current window key
 * - set EXPIRE on first hit
 *
 * Returns { allowed, limit, remaining, resetSeconds }.
 */
export async function checkRateLimit({
  key,
  limit,
  windowSeconds,
}) {
  const redis = getRedisConfig();
  const windowSec = clampSeconds(windowSeconds);

  // If no Redis configured, don't hard-block; rely on CDN caching.
  if (!redis) {
    return {
      allowed: true,
      limit,
      remaining: limit,
      resetSeconds: windowSec,
      degraded: true,
    };
  }

  const now = Date.now();
  const windowId = Math.floor(now / (windowSec * 1000));
  const redisKey = `rl:${key}:${windowSec}:${windowId}`;

  const incr = await upstashFetch(redis, `/incr/${encodeURIComponent(redisKey)}`);
  const count = Number(incr?.result ?? 0);

  if (count === 1) {
    await upstashFetch(redis, `/expire/${encodeURIComponent(redisKey)}/${windowSec}`);
  }

  const allowed = count <= limit;
  const remaining = Math.max(0, limit - count);
  return {
    allowed,
    limit,
    remaining,
    resetSeconds: windowSec,
    degraded: false,
  };
}

export function applyRateLimitHeaders(res, info) {
  res.setHeader("X-RateLimit-Limit", String(info.limit));
  res.setHeader("X-RateLimit-Remaining", String(info.remaining));
  res.setHeader("X-RateLimit-Reset", String(info.resetSeconds));
  if (info.degraded) res.setHeader("X-RateLimit-Mode", "degraded");
}

