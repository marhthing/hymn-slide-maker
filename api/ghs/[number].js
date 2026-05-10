import { readDb, setCaching, setCors } from "../_lib/ghs.js";

function parseNumber(value) {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 252) return null;
  return n;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  setCors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const n = parseNumber(req.query && req.query.number);
  if (!n) return res.status(400).json({ error: "Invalid hymn number. Use 1..252." });

  try {
    const db = await readDb(req);
    const hymn = (db.hymns || []).find((h) => h && h.number === n);
    if (!hymn) return res.status(404).json({ error: `Hymn #${n} not found.` });

    setCaching(res, 60 * 60 * 24);
    return res.status(200).json(hymn);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to load hymn",
      detail: error && typeof error === "object" && "message" in error ? String(error.message) : String(error),
    });
  }
}

