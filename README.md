# Hymn Slide Maker

Vite + React app to generate PPTX/PDF hymn slides.

## Public GHS API (Vercel)

This repo exposes a small, cache-friendly public API so other apps can fetch GHS hymns.

- `GET /api/ghs` metadata + endpoint list
- `GET /api/ghs/by-number?number=16` fetch hymn `1..252`
- `GET /api/ghs/search?q=...` basic search (title/lyrics), returns up to 20 results
- `GET /api/health` simple health check
- `GET /GHS-1-260.json` raw dataset

All API endpoints send permissive CORS headers (`Access-Control-Allow-Origin: *`) and are edge-cached.

Note: the GHS API responses are `Cache-Control: no-store` so rate limits can be enforced correctly. The dataset itself is served as a static file at `/GHS-1-260.json` and can be cached by the CDN.

## Rate limits (recommended)

Two tiers:

- Public (no key): **10 requests/minute per IP**
- API key (full usage): **120 requests/minute per key**

### Configure (Vercel environment variables)

Optional API key (enables the higher tier when supplied):

- `GHS_API_KEY`

Recommended for real rate limiting (shared counters across serverless instances):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
