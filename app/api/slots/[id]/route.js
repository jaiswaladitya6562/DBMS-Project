import { withTransaction } from "@/lib/mysql";
import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { SLOT_TYPES } from "@/lib/constants";
import { getSlotById, txGetSlotLocked, txUpdateSlot, deleteSlot } from "@/lib/queries4";

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError("Invalid slot id", 400);
  return id;
}

export const GET = handle(async (request, context) => {
  const slot = await getSlotById(parseId((await context.params).id));
  if (!slot) throw new HttpError("Slot not found", 404);
  return ok(slot);
});

export const PUT = handle(async (request, context) => {
  const id = parseId((await context.params).id);
  const body = await readJson(request);

  if (body?.slotType !== undefined && !SLOT_TYPES.includes(body.slotType)) {
    throw new HttpError("slotType must be Standard or Covered", 400);
  }
  if (body?.status !== undefined && !["Available", "Reserved"].includes(body.status)) {
    throw new HttpError("status must be Available or Reserved", 400);
  }
  if (body?.slotType === undefined && body?.status === undefined) {
    throw new HttpError("Nothing to update", 400);
  }

  await withTransaction(async (conn) => {
    const slot = await txGetSlotLocked(conn, id);
    if (!slot) throw new HttpError("Slot not found", 404);
    if (slot.Status === "Occupied") throw new HttpError("Slot is occupied", 409);
    await txUpdateSlot(conn, id, body.slotType ?? slot.Slot_Type, body.status ?? slot.Status);
  });

  return ok(await getSlotById(id));
});

export const DELETE = handle(async (request, context) => {
  const id = parseId((await context.params).id);
  const slot = await getSlotById(id);
  if (!slot) throw new HttpError("Slot not found", 404);
  if (slot.Status === "Occupied") throw new HttpError("Slot is occupied", 409);
  await deleteSlot(id);
  return ok({ deleted: true });
});
