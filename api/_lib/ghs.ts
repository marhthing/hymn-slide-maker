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
  const protoHeader = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) ?? "https";

  const hostHeader = req.headers["x-forwarded-host"] ?? req.headers.host;
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader;
  if (!host) return `${proto}://127.0.0.1`;
  return `${proto}://${host}`;
}

export async function readDb(req: VercelRequest): Promise<HymnDb> {
  if (cachedDb) return cachedDb;
  const url = `${baseUrl(req)}/GHS-1-260.json`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Failed to load dataset (${response.status}) from ${url}`);
  }
  const json = (await response.json()) as unknown;
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error(`Dataset is not a JSON object from ${url}`);
  }
  cachedDb = json as HymnDb;
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
