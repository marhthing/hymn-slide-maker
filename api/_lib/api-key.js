function headerValue(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function getProvidedApiKey(req) {
  const headerKey = headerValue(req.headers["x-api-key"]);
  if (headerKey) return String(headerKey).trim();
  const queryKey = req.query && (req.query.key ?? req.query.api_key ?? req.query.apiKey);
  if (typeof queryKey === "string") return queryKey.trim();
  return "";
}

export function isValidApiKey(provided) {
  const expected = process.env.GHS_API_KEY;
  if (!expected) return false;
  if (!provided) return false;
  return provided === expected;
}

