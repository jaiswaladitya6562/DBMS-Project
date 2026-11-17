import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { getDb } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import {
  cleanText,
  pickEnum,
  optionalPositiveInt,
  PRIORITIES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUSES,
} from "@/lib/validate";

export const GET = handle(async (request) => {
  await requireSession(request, "admin");
  const status = new URL(request.url).searchParams.get("status");
  if (status && !COMPLAINT_STATUSES.includes(status)) throw new HttpError("Invalid status", 400);

  const db = await getDb();
  const filter = status ? { status } : {};
  return ok(await db.collection("complaints").find(filter).sort({ createdAt: -1 }).limit(200).toArray());
});

// Customers only: admin reads and resolves complaints, never raises them
export const POST = handle(async (request) => {
  const session = await requireSession(request, "customer");
  const body = await readJson(request);

  const doc = {
    ownerId: session.ownerId,
    vehicleId: optionalPositiveInt(body?.vehicleId, "vehicleId"),
    category: pickEnum(body?.category, COMPLAINT_CATEGORIES, "category", "Other"),
    message: cleanText(body?.message, "message", { min: 5, max: 1000 }),
    priority: pickEnum(body?.priority, PRIORITIES, "priority", "Medium"),
    status: "Open",
    adminNote: "",
    createdAt: new Date(),
  };

  const db = await getDb();
  const result = await db.collection("complaints").insertOne(doc);
  await logActivity("complaint_created", session, { complaintId: String(result.insertedId) });
  return ok({ _id: result.insertedId, ...doc }, 201);
});
