export const COOKIE_NAME = "pms_session";
export const SESSION_SECONDS = 8 * 60 * 60;

const enc = new TextEncoder();

function toB64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "=".repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function getKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) throw new Error("AUTH_SECRET is missing or shorter than 16 characters");
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function createToken(payload) {
  const body = { ...payload, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS };
  const data = toB64url(enc.encode(JSON.stringify(body)));
  const sig = await crypto.subtle.sign("HMAC", await getKey(), enc.encode(data));
  return `${data}.${toB64url(new Uint8Array(sig))}`;
}

export async function verifyToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await getKey(), fromB64url(parts[1]), enc.encode(parts[0]));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(parts[0])));
    if (!payload.exp || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
