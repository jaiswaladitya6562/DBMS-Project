import { ok, handle } from "@/lib/helpers";
import { getSession } from "@/lib/auth";

export const GET = handle(async (request) => {
  const session = await getSession(request);
  return ok({
    user: session ? { role: session.role, name: session.name, ownerId: session.ownerId ?? null } : null,
  });
});
