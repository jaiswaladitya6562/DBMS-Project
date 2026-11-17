import { ok, handle, HttpError } from "@/lib/helpers";
import { getSession } from "@/lib/auth";
import { listHistory } from "@/lib/queries3";
import { listHistoryForOwner } from "@/lib/queries5";

export const GET = handle(async (request) => {
  const session = await getSession(request);
  if (!session) throw new HttpError("Login required", 401);
  if (session.role === "customer") return ok(await listHistoryForOwner(session.ownerId));

  const raw = new URL(request.url).searchParams.get("vehicleId");
  let vehicleId = null;
  if (raw) {
    vehicleId = Number(raw);
    if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
      throw new HttpError("Invalid vehicleId", 400);
    }
  }
  return ok(await listHistory(vehicleId));
});
