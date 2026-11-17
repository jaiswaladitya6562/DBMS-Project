import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { getDb } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { cleanText, optionalPositiveInt } from "@/lib/validate";

export const GET = handle(async (request) => {
  await requireSession(request, "admin");
  const db = await getDb();
  return ok(await db.collection("feedback").find({}).sort({ createdAt: -1 }).limit(200).toArray());
});

// Customers only: admin reads feedback, never writes it
export const POST = handle(async (request) => {
  const session = await requireSession(request, "customer");
  const body = await readJson(request);

  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError("rating must be a whole number from 1 to 5", 400);
  }

  const doc = {
    ownerId: session.ownerId,
    vehicleId: optionalPositiveInt(body?.vehicleId, "vehicleId"),
    rating,
    message: cleanText(body?.message, "message", { max: 1000 }),
    createdAt: new Date(),
  };

  const db = await getDb();
  const result = await db.collection("feedback").insertOne(doc);
  await logActivity("feedback_created", session, { feedbackId: String(result.insertedId) });
  return ok({ _id: result.insertedId, ...doc }, 201);
});
