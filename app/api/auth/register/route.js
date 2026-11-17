import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { startSession } from "@/lib/auth";
import { hashPassword, passwordError } from "@/lib/password";
import { findOwnerByPhone, insertOwnerAccount } from "@/lib/queries6";
import { logActivity } from "@/lib/activity";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = handle(async (request) => {
  const body = await readJson(request);

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = String(body?.phone || "").trim();
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (name.length < 2 || name.length > 100) throw new HttpError("Name must be 2-100 characters", 400);
  if (!/^\d{10}$/.test(phone)) throw new HttpError("Phone must be 10 digits", 400);
  if (email && (email.length > 100 || !EMAIL_RE.test(email))) throw new HttpError("Invalid email address", 400);
  const pwError = passwordError(body?.password);
  if (pwError) throw new HttpError(pwError, 400);

  const taken = "An account with this phone number already exists";
  if (await findOwnerByPhone(phone)) throw new HttpError(taken, 409);

  let ownerId;
  try {
    ownerId = await insertOwnerAccount(name, phone, email, await hashPassword(body.password));
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") throw new HttpError(taken, 409);
    throw err;
  }

  const session = { role: "customer", ownerId, name };
  await startSession(session);
  await logActivity("register", session);
  return ok({ role: "customer", name }, 201);
});
