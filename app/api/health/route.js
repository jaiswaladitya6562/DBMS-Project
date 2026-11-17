import { ok, fail, handle } from "@/lib/helpers";
import { countSlotsByStatus } from "@/lib/queries";

// Visit /api/health to confirm the MySQL connection works
export const GET = handle(async () => {
  const slots = await countSlotsByStatus();
  return ok({ status: "ok", slots });
});
