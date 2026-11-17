import { ok, handle, readJson } from "@/lib/helpers";
import { getDb } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { cleanText, pickEnum, optionalPositiveInt, PRIORITIES } from "@/lib/validate";

export const GET = handle(async (request) => {
  const session = await requireSession(request);
  const filter =
    session.role === "admin" ? {} : { $or: [{ ownerId: session.ownerId }, { ownerId: null }] };
  const db = await getDb();
  return ok(await db.collection("notifications").find(filter).sort({ createdAt: -1 }).limit(50).toArray());
});

export const POST = handle(async (request) => {
  const session = await requireSession(request, "admin");
  const body = await readJson(request);

  const doc = {
    ownerId: optionalPositiveInt(body?.ownerId, "ownerId"),
    message: cleanText(body?.message, "message", { min: 3, max: 500 }),
    priority: pickEnum(body?.priority, PRIORITIES, "priority", "Medium"),
    createdAt: new Date(),
  };

  const db = await getDb();
  const result = await db.collection("notifications").insertOne(doc);
  await logActivity("notification_sent", session, { notificationId: String(result.insertedId), ownerId: doc.ownerId });
  return ok({ _id: result.insertedId, ...doc }, 201);
});
