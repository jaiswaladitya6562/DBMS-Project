import { cookies } from "next/headers";
import { ok, handle } from "@/lib/helpers";
import { COOKIE_NAME } from "@/lib/session";

export const POST = handle(async () => {
  (await cookies()).delete(COOKIE_NAME);
  return ok({ loggedOut: true });
});
