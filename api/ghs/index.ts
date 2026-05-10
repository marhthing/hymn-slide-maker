import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readDb, setCaching, withCors } from "../_lib/ghs";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  for (const [k, v] of Object.entries(withCors({ "content-type": "application/json; charset=utf-8" }))) {
    res.setHeader(k, v);
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const db = await readDb(req);
    setCaching(res, 60 * 60 * 24); // 24h

    return res.status(200).json({
      title: db.title,
      total: db.total,
      range: { min: 1, max: 252 },
      endpoints: {
        byNumber: "/api/ghs/:number",
        search: "/api/ghs/search?q=...",
        raw: "/GHS-1-260.json",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to load GHS dataset",
      detail: error instanceof Error ? error.message : String(error),
      hint: "Check that /GHS-1-260.json is accessible on the deployed site.",
    });
  }
}
