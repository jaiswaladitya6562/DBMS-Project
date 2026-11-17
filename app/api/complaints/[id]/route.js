import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { getDb } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { cleanText, pickEnum, parseObjectId, COMPLAINT_STATUSES } from "@/lib/validate";

export const PUT = handle(async (request, context) => {
  const session = await requireSession(request, "admin");
  const _id = parseObjectId((await context.params).id);
  const body = await readJson(request);

  const update = {};
  if (body?.status !== undefined) update.status = pickEnum(body.status, COMPLAINT_STATUSES, "status");
  if (body?.adminNote !== undefined) update.adminNote = cleanText(body.adminNote, "adminNote", { min: 0, max: 1000 });
  if (Object.keys(update).length === 0) throw new HttpError("Nothing to update", 400);
  update.updatedAt = new Date();

  const db = await getDb();
  const result = await db.collection("complaints").findOneAndUpdate(
    { _id },
    { $set: update },
    { returnDocument: "after" }
  );
  const doc = result?.value !== undefined ? result.value : result;
  if (!doc) throw new HttpError("Complaint not found", 404);

  await logActivity("complaint_updated", session, { complaintId: String(_id), ...update });
  return ok(doc);
});
