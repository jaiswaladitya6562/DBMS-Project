import { ok, handle, HttpError, readJson, VEHICLE_TYPES } from "@/lib/helpers";
import { SLOT_TYPES } from "@/lib/constants";
import { listRates } from "@/lib/queries";
import { upsertRate } from "@/lib/queries4";

export const GET = handle(async () => ok(await listRates()));

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const ratePerHour = Number(body?.ratePerHour);

  if (!VEHICLE_TYPES.includes(body?.vehicleType)) throw new HttpError("Invalid vehicleType", 400);
  if (!SLOT_TYPES.includes(body?.slotType)) throw new HttpError("Invalid slotType", 400);
  if (!Number.isFinite(ratePerHour) || ratePerHour <= 0 || ratePerHour > 100000) {
    throw new HttpError("ratePerHour must be a positive number", 400);
  }

  await upsertRate(body.vehicleType, body.slotType, ratePerHour);
  return ok(await listRates(), 201);
});
