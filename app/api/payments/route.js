import { withTransaction } from "@/lib/mysql";
import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { PAYMENT_METHODS } from "@/lib/constants";
import {
  listPayments,
  getPaymentByReceiptId,
  txGetRecordForUpdate,
  txGetPaymentForUpdate,
  txInsertPayment,
  txMarkPaymentPaid,
} from "@/lib/queries3";

export const GET = handle(async () => ok(await listPayments()));

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const receiptId = Number(body?.receiptId);
  const method = body?.paymentMethod;
  if (!Number.isInteger(receiptId) || receiptId <= 0) {
    throw new HttpError("receiptId is required", 400);
  }
  if (!PAYMENT_METHODS.includes(method)) {
    throw new HttpError("paymentMethod must be Cash, UPI or Card", 400);
  }

  await withTransaction(async (conn) => {
    const record = await txGetRecordForUpdate(conn, receiptId);
    if (!record) throw new HttpError("Receipt not found", 404);
    if (!record.Exit_Time) throw new HttpError("Vehicle has not exited yet", 409);

    const existing = await txGetPaymentForUpdate(conn, receiptId);
    if (existing && existing.Payment_Status === "Paid") {
      throw new HttpError("Already paid", 409);
    }
    if (existing) await txMarkPaymentPaid(conn, existing.Payment_ID, method);
    else await txInsertPayment(conn, receiptId, method, record.Amount, "Paid");
  });

  return ok(await getPaymentByReceiptId(receiptId), 201);
});
