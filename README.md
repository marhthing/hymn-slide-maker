# Hymn Slide Maker

Vite + React app to generate PPTX/PDF hymn slides.

## Public GHS API (Vercel)

This repo exposes a small, cache-friendly public API so other apps can fetch GHS hymns.

- `GET /api/ghs` metadata + endpoint list
- `GET /api/ghs/:number` fetch hymn `1..252`
- `GET /api/ghs/search?q=...` basic search (title/lyrics), returns up to 20 results
- `GET /GHS-1-260.json` raw dataset

All API endpoints send permissive CORS headers (`Access-Control-Allow-Origin: *`) and are edge-cached.

