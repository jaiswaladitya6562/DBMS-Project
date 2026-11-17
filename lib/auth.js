import { cookies } from "next/headers";
import { COOKIE_NAME, SESSION_SECONDS, createToken, verifyToken } from "@/lib/session";
import { HttpError } from "@/lib/helpers";

export async function getSession(request) {
  return verifyToken(request.cookies?.get(COOKIE_NAME)?.value);
}

export async function requireSession(request, role) {
  const session = await getSession(request);
  if (!session) throw new HttpError("Login required", 401);
  if (role && session.role !== role) throw new HttpError("Not allowed", 403);
  return session;
}

export async function startSession(session) {
  const token = await createToken(session);
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}
