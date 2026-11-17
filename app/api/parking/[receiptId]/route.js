import { withTransaction } from "@/lib/mysql";
import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { PAYMENT_METHODS } from "@/lib/constants";
import { getReceiptById, txSetSlotStatus } from "@/lib/queries";
import { getReceiptByIdWithOwner } from "@/lib/queries6";
import {
  txGetRecordForUpdate,
  txCloseRecord,
  txGetRecordAmount,
  txInsertPayment,
  getPaymentByReceiptId,
} from "@/lib/queries3";
import { requireSession, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError("Invalid receipt id", 400);
  return id;
}

// A customer can only open receipts of their own vehicles
export const GET = handle(async (request, context) => {
  const session = await requireSession(request);
  const id = parseId((await context.params).receiptId);
  const receipt = await getReceiptByIdWithOwner(id);
  if (!receipt || (session.role === "customer" && receipt.Owner_ID !== session.ownerId)) {
    throw new HttpError("Receipt not found", 404);
  }
  const payment = await getPaymentByReceiptId(id);
  return ok({ ...receipt, Payment: payment });
});

export const PUT = handle(async (request, context) => {
  const session = await getSession(request);
  if (session?.role !== "admin") throw new HttpError("Not allowed", 403);

  const id = parseId((await context.params).receiptId);
  const body = await readJson(request);
  const method = body?.paymentMethod;
  if (method !== undefined && !PAYMENT_METHODS.includes(method)) {
    throw new HttpError("paymentMethod must be Cash, UPI or Card", 400);
  }

  await withTransaction(async (conn) => {
    const record = await txGetRecordForUpdate(conn, id);
    if (!record) throw new HttpError("Receipt not found", 404);
    if (record.Exit_Time) throw new HttpError("Vehicle has already exited", 409);

    await txCloseRecord(conn, id, record.Rate_Per_Hour);
    const { Amount } = await txGetRecordAmount(conn, id);
    await txInsertPayment(conn, id, method || "Cash", Amount, method ? "Paid" : "Pending");
    await txSetSlotStatus(conn, record.Slot_ID, "Available");
  });

  const receipt = await getReceiptById(id);
  const payment = await getPaymentByReceiptId(id);
  await logActivity("parking_exit", session, {
    receiptId: id,
    amount: Number(receipt.Amount),
    paymentStatus: payment?.Payment_Status ?? null,
  });
  return ok({ ...receipt, Payment: payment });
});
