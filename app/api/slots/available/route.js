import { ok, handle } from "@/lib/helpers";
import { listAvailableSlots } from "@/lib/queries";

export const GET = handle(async () => ok(await listAvailableSlots()));
