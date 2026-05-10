import path from "node:path";
import fs from "node:fs/promises";

export type Hymn = {
  number: number;
  title: string;
  verses: { verse: number; text: string }[];
  chorus?: string;
};

export type HymnDb = {
  title: string;
  total: number;
  hymns: Hymn[];
};

let cachedDb: HymnDb | null = null;

function dataPath() {
  return path.join(process.cwd(), "public", "GHS-1-260.json");
}

export async function readDb(): Promise<HymnDb> {
  if (cachedDb) return cachedDb;
  const raw = await fs.readFile(dataPath(), "utf8");
  cachedDb = JSON.parse(raw) as HymnDb;
  return cachedDb;
}

export function normalizeQuery(query: unknown): string {
  if (typeof query !== "string") return "";
  return query.trim();
}

export function withCors(headers: Record<string, string> = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...headers,
  };
}

export function setCaching(res: { setHeader: (k: string, v: string) => void }, seconds: number) {
  // Cache at the Vercel edge; allow browsers to cache too.
  res.setHeader("Cache-Control", `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=86400`);
}

