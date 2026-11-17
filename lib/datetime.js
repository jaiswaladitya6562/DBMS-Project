export function normalizeDateTime(value) {
  if (typeof value !== "string") return null;
  const m = value.trim().match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const result = `${m[1]} ${m[2]}:${m[3] || "00"}`;
  if (Number.isNaN(new Date(result.replace(" ", "T")).getTime())) return null;
  return result;
}
