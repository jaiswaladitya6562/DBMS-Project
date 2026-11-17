import { getDb } from "@/lib/mongodb";

export async function logActivity(action, actor, details = {}) {
  try {
    const db = await getDb();
    await db.collection("activity_logs").insertOne({
      action,
      actor: actor ? { role: actor.role, ownerId: actor.ownerId ?? null } : null,
      details,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("activity log failed:", err.message);
  }
}
