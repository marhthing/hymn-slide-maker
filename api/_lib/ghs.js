let cachedDb = null;

function headerValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function baseUrl(req) {
  const proto = headerValue(req.headers["x-forwarded-proto"]) || "https";
  const host =
    headerValue(req.headers["x-forwarded-host"]) ||
    headerValue(req.headers["host"]) ||
    "127.0.0.1";
  return `${proto}://${host}`;
}

export async function readDb(req) {
  if (cachedDb) return cachedDb;
  const url = `${baseUrl(req)}/GHS-1-260.json`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Failed to load dataset (${response.status}) from ${url}`);
  }
  const json = await response.json();
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error(`Dataset is not a JSON object from ${url}`);
  }
  cachedDb = json;
  return cachedDb;
}

export function normalizeQuery(query) {
  return typeof query === "string" ? query.trim() : "";
}

export function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
}

export function setCaching(res, seconds) {
  res.setHeader(
    "Cache-Control",
    `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=86400`,
  );
}

