import { createHash, timingSafeEqual } from "crypto";
import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { startSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { findOwnerByPhone } from "@/lib/queries6";
import { clientIp, checkLimit, recordFailure, clearFailures } from "@/lib/ratelimit";
import { logActivity } from "@/lib/activity";

// Compared against when the phone is unknown, so response time does not reveal which phones exist
const DUMMY_HASH =
  "scrypt$624b345aa227003d93960d905aace3d9$82ea17419f3bd25a4cbe001febc427b7e2111624993fd5527e19dc12f7e49efa0bdd93b724e222c3087ca035d8c5b467b442b0e627151a950e6e36e66c939ef6";

const sha = (value) => createHash("sha256").update(value).digest();

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const ip = clientIp(request);
  let session;

  if (body?.role === "admin") {
    const key = `admin|${ip}`;
    checkLimit(key);
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new HttpError("Admin login is not configured", 500);
    const given = typeof body.password === "string" ? body.password : "";
    if (!timingSafeEqual(sha(given), sha(expected))) {
      recordFailure(key);
      throw new HttpError("Invalid credentials", 401);
    }
    clearFailures(key);
    session = { role: "admin", name: "Admin" };
  } else if (body?.role === "customer") {
    const phone = String(body.phone || "").trim();
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^\d{10}$/.test(phone) || !password) {
      throw new HttpError("Enter your 10-digit phone number and password", 400);
    }

    const key = `${phone}|${ip}`;
    checkLimit(key);
    const owner = await findOwnerByPhone(phone);
    const valid = await verifyPassword(password, owner?.Password_Hash || DUMMY_HASH);
    if (!owner?.Password_Hash || !valid) {
      recordFailure(key);
      throw new HttpError("Invalid phone number or password", 401);
    }
    clearFailures(key);
    session = { role: "customer", ownerId: owner.Owner_ID, name: owner.Owner_Name };
  } else {
    throw new HttpError("role must be admin or customer", 400);
  }

  await startSession(session);
  await logActivity("login", session);
  return ok({ role: session.role, name: session.name });
});
