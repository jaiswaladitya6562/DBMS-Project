import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { getDb } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { cleanText, pickEnum, optionalPositiveInt, PRIORITIES, INCIDENT_TYPES } from "@/lib/validate";

export const GET = handle(async (request) => {
  await requireSession(request, "admin");
  const db = await getDb();
  return ok(await db.collection("incidents").find({}).sort({ createdAt: -1 }).limit(200).toArray());
});

export const POST = handle(async (request) => {
  const session = await requireSession(request, "admin");
  const body = await readJson(request);

  let slotNumber = null;
  if (body?.slotNumber) {
    slotNumber = String(body.slotNumber).trim().toUpperCase();
    if (!/^[A-Z0-9-]{1,10}$/.test(slotNumber)) throw new HttpError("Invalid slotNumber", 400);
  }

  const doc = {
    type: pickEnum(body?.type, INCIDENT_TYPES, "type"),
    vehicleId: optionalPositiveInt(body?.vehicleId, "vehicleId"),
    slotNumber,
    message: cleanText(body?.message, "message", { min: 5, max: 1000 }),
    priority: pickEnum(body?.priority, PRIORITIES, "priority", "Medium"),
    createdAt: new Date(),
  };

  const db = await getDb();
  const result = await db.collection("incidents").insertOne(doc);
  await logActivity("incident_created", session, { incidentId: String(result.insertedId), type: doc.type });
  return ok({ _id: result.insertedId, ...doc }, 201);
});
