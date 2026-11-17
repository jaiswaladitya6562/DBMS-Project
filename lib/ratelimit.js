import { HttpError } from "@/lib/helpers";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 5;

// In-memory, per server instance. Slows down guessing; not a hard guarantee on serverless.
const store = globalThis._loginAttempts ?? (globalThis._loginAttempts = new Map());

export function clientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
}

export function checkLimit(key) {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry) return;
  if (entry.reset < now) {
    store.delete(key);
    return;
  }
  if (entry.fails >= MAX_FAILS) {
    const minutes = Math.ceil((entry.reset - now) / 60000);
    throw new HttpError(`Too many failed attempts. Try again in ${minutes} minute(s)`, 429);
  }
}

export function recordFailure(key) {
  const now = Date.now();
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.reset < now) store.delete(k);
  }
  const entry = store.get(key);
  if (!entry || entry.reset < now) store.set(key, { fails: 1, reset: now + WINDOW_MS });
  else entry.fails += 1;
}

export function clearFailures(key) {
  store.delete(key);
}
