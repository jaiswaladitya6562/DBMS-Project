import { ok, handle } from "@/lib/helpers";
import { getDb } from "@/lib/mongodb";
import { requireSession } from "@/lib/auth";

export const GET = handle(async (request) => {
  await requireSession(request, "admin");
  const raw = Number(new URL(request.url).searchParams.get("limit"));
  const limit = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 200) : 50;
  const db = await getDb();
  return ok(await db.collection("activity_logs").find({}).sort({ createdAt: -1 }).limit(limit).toArray());
});
