import { ok, handle } from "@/lib/helpers";
import { occupancyBySlotType, countActiveReservations } from "@/lib/queries4";

export const GET = handle(async () => {
  const [rows, activeReservations] = await Promise.all([
    occupancyBySlotType(),
    countActiveReservations(),
  ]);

  const bySlotType = rows.map((r) => ({
    Slot_Type: r.Slot_Type,
    Total: Number(r.Total),
    Available: Number(r.Available),
    Occupied: Number(r.Occupied),
    Reserved: Number(r.Reserved),
  }));

  const sum = (key) => bySlotType.reduce((n, r) => n + r[key], 0);
  const total = sum("Total");
  const occupied = sum("Occupied");

  return ok({
    total,
    available: sum("Available"),
    occupied,
    reserved: sum("Reserved"),
    occupancyPercent: total ? Math.round((occupied / total) * 100) : 0,
    activeReservations,
    bySlotType,
  });
});
