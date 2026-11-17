import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { SLOT_TYPES } from "@/lib/constants";
import { listSlots } from "@/lib/queries";
import { insertSlot, getSlotById } from "@/lib/queries4";

export const GET = handle(async () => ok(await listSlots()));

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const slotNumber = String(body?.slotNumber || "").trim().toUpperCase();
  const slotType = body?.slotType;

  if (!/^[A-Z0-9-]{1,10}$/.test(slotNumber)) {
    throw new HttpError("slotNumber must be 1-10 letters, digits or dashes", 400);
  }
  if (!SLOT_TYPES.includes(slotType)) throw new HttpError("slotType must be Standard or Covered", 400);

  const id = await insertSlot(slotNumber, slotType);
  return ok(await getSlotById(id), 201);
});
