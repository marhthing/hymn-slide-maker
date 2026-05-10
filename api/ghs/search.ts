import type { VercelRequest, VercelResponse } from "@vercel/node";
import { normalizeQuery, readDb, setCaching, withCors } from "../_lib/ghs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  for (const [k, v] of Object.entries(withCors({ "content-type": "application/json; charset=utf-8" }))) {
    res.setHeader(k, v);
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const q = normalizeQuery(req.query.q);
  if (!q) return res.status(400).json({ error: "Missing query parameter `q`." });

  try {
    const db = await readDb(req);
    const needle = q.toLowerCase();

    const results = db.hymns
      .filter((h) => {
        if (String(h.number) === needle) return true;
        if (h.title.toLowerCase().includes(needle)) return true;
        if (h.chorus && h.chorus.toLowerCase().includes(needle)) return true;
        return h.verses.some((v) => v.text.toLowerCase().includes(needle));
      })
      .slice(0, 20)
      .map((h) => ({ number: h.number, title: h.title }));

    setCaching(res, 60 * 10); // 10m (query results)
    return res.status(200).json({ q, count: results.length, results });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Search failed",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}
