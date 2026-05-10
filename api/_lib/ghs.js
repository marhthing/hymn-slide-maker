import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

let cachedDb = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, "..", "_data", "GHS-1-260.json");

export async function readDb() {
  if (cachedDb) return cachedDb;
  const raw = await fs.readFile(dataFile, "utf8");
  const json = JSON.parse(raw);
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("Dataset is not a JSON object");
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
