import { ok, handle, readJson, missingFields, isPositiveInt, HttpError, VEHICLE_TYPES } from "@/lib/helpers";
import { requireSession } from "@/lib/auth";
import { getVehicleById, updateVehicle, deleteVehicle } from "@/lib/queries";

async function parseId(context) {
  const { id } = await context.params;
  if (!isPositiveInt(id)) throw new HttpError("Invalid vehicle id");
  return Number(id);
}

// A customer can only reach their own vehicles; anything else looks like "not found"
async function loadVehicle(session, id) {
  const vehicle = await getVehicleById(id);
  if (!vehicle || (session.role === "customer" && vehicle.Owner_ID !== session.ownerId)) {
    throw new HttpError("Vehicle not found", 404);
  }
  return vehicle;
}

export const GET = handle(async (request, context) => {
  const session = await requireSession(request);
  return ok(await loadVehicle(session, await parseId(context)));
});

// Customer only. Body: { vehicleNumber, vehicleType, model? }. Ownership cannot be changed.
export const PUT = handle(async (request, context) => {
  const session = await requireSession(request, "customer");
  const id = await parseId(context);
  await loadVehicle(session, id);

  const body = await readJson(request);
  const err = missingFields(body, ["vehicleNumber", "vehicleType"]);
  if (err) throw new HttpError(err);

  const number = String(body.vehicleNumber).replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9-]{4,20}$/.test(number)) throw new HttpError("Invalid vehicle number");
  if (!VEHICLE_TYPES.includes(body.vehicleType)) throw new HttpError("Vehicle type must be Bike, Car, SUV or Truck");
  const model = typeof body.model === "string" ? body.model.trim().slice(0, 50) : "";

  try {
    await updateVehicle(id, number, body.vehicleType, model, session.ownerId);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new HttpError("This vehicle number is already registered", 409);
    throw e;
  }
  return ok(await getVehicleById(id));
});

// Customer only. Fails with 409 if the vehicle has parking records or reservations.
export const DELETE = handle(async (request, context) => {
  const session = await requireSession(request, "customer");
  const id = await parseId(context);
  await loadVehicle(session, id);
  await deleteVehicle(id);
  return ok({ deleted: id });
});
