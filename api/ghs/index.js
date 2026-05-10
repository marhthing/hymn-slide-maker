import { readDb, setCaching, setCors } from "../_lib/ghs.js";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const db = await readDb(req);
    setCaching(res, 60 * 60 * 24);
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
      detail: error && typeof error === "object" && "message" in error ? String(error.message) : String(error),
    });
  }
}

