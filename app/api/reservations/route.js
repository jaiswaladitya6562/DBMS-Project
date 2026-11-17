import { withTransaction } from "@/lib/mysql";
import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { normalizeDateTime } from "@/lib/datetime";
import { txSetSlotStatus } from "@/lib/queries";
import {
  listReservations,
  getReservationById,
  txGetVehicleId,
  txGetSlotLocked,
  txIsNotPast,
  txCountOverlaps,
  txInsertReservation,
} from "@/lib/queries4";

export const GET = handle(async () => ok(await listReservations()));

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const vehicleId = Number(body?.vehicleId);
  const slotId = Number(body?.slotId);
  const startTime = normalizeDateTime(body?.startTime);
  const endTime = normalizeDateTime(body?.endTime);

  if (!Number.isInteger(vehicleId) || vehicleId <= 0) throw new HttpError("vehicleId is required", 400);
  if (!Number.isInteger(slotId) || slotId <= 0) throw new HttpError("slotId is required", 400);
  if (!startTime || !endTime) throw new HttpError("Valid startTime and endTime are required", 400);
  if (endTime <= startTime) throw new HttpError("endTime must be after startTime", 400);

  const id = await withTransaction(async (conn) => {
    if (!(await txGetVehicleId(conn, vehicleId))) throw new HttpError("Vehicle not found", 404);

    const slot = await txGetSlotLocked(conn, slotId);
    if (!slot) throw new HttpError("Slot not found", 404);
    if (slot.Status !== "Available") throw new HttpError("Slot is not available", 409);

    if (!(await txIsNotPast(conn, startTime))) {
      throw new HttpError("startTime cannot be in the past", 400);
    }
    if ((await txCountOverlaps(conn, slotId, startTime, endTime)) > 0) {
      throw new HttpError("Slot already reserved for that period", 409);
    }

    const newId = await txInsertReservation(conn, vehicleId, slotId, startTime, endTime);
    await txSetSlotStatus(conn, slotId, "Reserved");
    return newId;
  });

  return ok(await getReservationById(id), 201);
});
