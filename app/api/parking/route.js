import { ok, handle, readJson, missingFields, isPositiveInt, HttpError } from "@/lib/helpers";
import { withTransaction } from "@/lib/mysql";
import { requireSession } from "@/lib/auth";
import {
  listCurrentlyParked,
  getReceiptById,
  getVehicleById,
  txGetVehicle,
  txGetSlotForUpdate,
  txGetActiveRecordForVehicle,
  txGetRate,
  txInsertParkingRecord,
  txSetSlotStatus,
} from "@/lib/queries";
import { listCurrentlyParkedByOwner } from "@/lib/queries6";

// GET /api/parking : vehicles currently parked. Customer sees only their own.
export const GET = handle(async (request) => {
  const session = await requireSession(request);
  if (session.role === "customer") return ok(await listCurrentlyParkedByOwner(session.ownerId));
  return ok(await listCurrentlyParked());
});

// POST /api/parking : parking entry. Body: { vehicleId, slotId }. A customer can only park their own vehicle.
export const POST = handle(async (request) => {
  const session = await requireSession(request);
  const body = await readJson(request);
  const err = missingFields(body, ["vehicleId", "slotId"]);
  if (err) throw new HttpError(err);
  if (!isPositiveInt(body.vehicleId) || !isPositiveInt(body.slotId)) throw new HttpError("Invalid vehicleId or slotId");

  const owned = await getVehicleById(Number(body.vehicleId));
  if (!owned || (session.role === "customer" && owned.Owner_ID !== session.ownerId)) {
    throw new HttpError("Vehicle not found", 404);
  }

  const receiptId = await withTransaction(async (conn) => {
    const vehicle = await txGetVehicle(conn, body.vehicleId);
    if (!vehicle) throw new HttpError("Vehicle not found", 404);

    const slot = await txGetSlotForUpdate(conn, body.slotId);
    if (!slot) throw new HttpError("Slot not found", 404);
    if (slot.Status !== "Available") throw new HttpError(`Slot is ${slot.Status}, not available`, 409);

    if (await txGetActiveRecordForVehicle(conn, vehicle.Vehicle_ID))
      throw new HttpError("This vehicle is already parked", 409);

    const rate = await txGetRate(conn, vehicle.Vehicle_Type, slot.Slot_Type);
    if (!rate) throw new HttpError("No parking rate defined for this vehicle and slot type", 400);

    const id = await txInsertParkingRecord(conn, vehicle.Vehicle_ID, slot.Slot_ID, rate.Rate_ID);
    await txSetSlotStatus(conn, slot.Slot_ID, "Occupied");
    return id;
  });

  return ok(await getReceiptById(receiptId), 201);
});
