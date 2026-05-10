import type { VercelRequest } from "@vercel/node";

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

function baseUrl(req: VercelRequest) {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  const host = req.headers.host;
  if (!host) return `${proto}://localhost`;
  return `${proto}://${host}`;
}

export async function readDb(req: VercelRequest): Promise<HymnDb> {
  if (cachedDb) return cachedDb;
  const url = `${baseUrl(req)}/GHS-1-260.json`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Failed to load dataset (${response.status}) from ${url}`);
  }
  cachedDb = (await response.json()) as HymnDb;
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
