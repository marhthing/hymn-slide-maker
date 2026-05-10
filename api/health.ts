import type { VercelRequest, VercelResponse } from "@vercel/node";
import { setCaching, withCors } from "./_lib/ghs";

export default function handler(req: VercelRequest, res: VercelResponse) {
  for (const [k, v] of Object.entries(withCors({ "content-type": "application/json; charset=utf-8" }))) {
    res.setHeader(k, v);
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });

  setCaching(res, 60);
  return res.status(200).json({ ok: true });
}

