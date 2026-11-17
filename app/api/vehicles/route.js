import { ok, handle, readJson, missingFields, HttpError, VEHICLE_TYPES } from "@/lib/helpers";
import { requireSession } from "@/lib/auth";
import { listVehicles, getVehicleById, insertVehicle } from "@/lib/queries";
import { listVehiclesByOwner } from "@/lib/queries6";

// Customer: own vehicles only. Admin: all registered vehicles (read-only).
export const GET = handle(async (request) => {
  const session = await requireSession(request);
  if (session.role === "customer") return ok(await listVehiclesByOwner(session.ownerId));
  return ok(await listVehicles());
});

// Customer only. Body: { vehicleNumber, vehicleType, model? }. The owner is always the logged-in customer.
export const POST = handle(async (request) => {
  const session = await requireSession(request, "customer");
  const body = await readJson(request);
  const err = missingFields(body, ["vehicleNumber", "vehicleType"]);
  if (err) throw new HttpError(err);

  const number = String(body.vehicleNumber).replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z0-9-]{4,20}$/.test(number)) throw new HttpError("Invalid vehicle number");
  if (!VEHICLE_TYPES.includes(body.vehicleType)) throw new HttpError("Vehicle type must be Bike, Car, SUV or Truck");
  const model = typeof body.model === "string" ? body.model.trim().slice(0, 50) : "";

  let vehicleId;
  try {
    vehicleId = await insertVehicle(number, body.vehicleType, model, session.ownerId);
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY") throw new HttpError("This vehicle number is already registered", 409);
    throw e;
  }
  return ok(await getVehicleById(vehicleId), 201);
});
