import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readDb, setCaching, withCors } from "../_lib/ghs";

function parseNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 252) return null;
  return n;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  for (const [k, v] of Object.entries(withCors({ "content-type": "application/json; charset=utf-8" }))) {
    res.setHeader(k, v);
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  const n = parseNumber(req.query.number);
  if (!n) return res.status(400).json({ error: "Invalid hymn number. Use 1..252." });

  const db = await readDb();
  const hymn = db.hymns.find((h) => h.number === n);
  if (!hymn) return res.status(404).json({ error: `Hymn #${n} not found.` });

  setCaching(res, 60 * 60 * 24); // 24h
  return res.status(200).json(hymn);
}

