import { ok, handle } from "@/lib/helpers";
import { revenueTotals, revenueByDay, revenueByMethod, revenueByVehicleType } from "@/lib/queries4";

const num = (rows) =>
  rows.map((r) => ({ ...r, Revenue: Number(r.Revenue), Payments: Number(r.Payments) }));

export const GET = handle(async () => {
  const [totals, byDay, byMethod, byVehicleType] = await Promise.all([
    revenueTotals(),
    revenueByDay(),
    revenueByMethod(),
    revenueByVehicleType(),
  ]);

  return ok({
    totalPaid: Number(totals.Total_Paid),
    totalPending: Number(totals.Total_Pending),
    todayPaid: Number(totals.Today_Paid),
    paymentCount: Number(totals.Payment_Count),
    byDay: num(byDay),
    byMethod: num(byMethod),
    byVehicleType: num(byVehicleType),
  });
});
