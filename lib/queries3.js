import { query } from "@/lib/mysql";

const first = ([rows]) => rows[0] || null;

export function txGetRecordForUpdate(conn, receiptId) {
  return conn
    .execute(
      `SELECT r.Receipt_ID, r.Slot_ID, r.Exit_Time, r.Amount, rt.Rate_Per_Hour
       FROM Parking_Record r
       JOIN Parking_Rate rt ON rt.Rate_ID = r.Rate_ID
       WHERE r.Receipt_ID = ?
       FOR UPDATE`,
      [receiptId]
    )
    .then(first);
}

export function txCloseRecord(conn, receiptId, ratePerHour) {
  return conn.execute(
    `UPDATE Parking_Record
     SET Exit_Time = NOW(),
         Duration = CEIL(TIMESTAMPDIFF(SECOND, Entry_Time, NOW()) / 60),
         Amount = GREATEST(1, CEIL(TIMESTAMPDIFF(SECOND, Entry_Time, NOW()) / 3600)) * ?
     WHERE Receipt_ID = ? AND Exit_Time IS NULL`,
    [ratePerHour, receiptId]
  );
}

export function txGetRecordAmount(conn, receiptId) {
  return conn
    .execute(`SELECT Amount FROM Parking_Record WHERE Receipt_ID = ?`, [receiptId])
    .then(first);
}

export function txGetPaymentForUpdate(conn, receiptId) {
  return conn
    .execute(`SELECT * FROM Payment WHERE Receipt_ID = ? FOR UPDATE`, [receiptId])
    .then(first);
}

export function txInsertPayment(conn, receiptId, method, amount, status) {
  return conn.execute(
    `INSERT INTO Payment (Receipt_ID, Payment_Date, Payment_Method, Amount, Payment_Status)
     VALUES (?, NOW(), ?, ?, ?)`,
    [receiptId, method, amount, status]
  );
}

export function txMarkPaymentPaid(conn, paymentId, method) {
  return conn.execute(
    `UPDATE Payment
     SET Payment_Method = ?, Payment_Status = 'Paid', Payment_Date = NOW()
     WHERE Payment_ID = ?`,
    [method, paymentId]
  );
}

export async function getPaymentByReceiptId(receiptId) {
  const rows = await query(`SELECT * FROM Payment WHERE Receipt_ID = ?`, [receiptId]);
  return rows[0] || null;
}

export function listPayments() {
  return query(
    `SELECT p.Payment_ID, p.Receipt_ID, p.Payment_Date, p.Payment_Method, p.Amount,
            p.Payment_Status, v.Vehicle_Number, s.Slot_Number
     FROM Payment p
     JOIN Parking_Record r ON r.Receipt_ID = p.Receipt_ID
     JOIN Vehicle v ON v.Vehicle_ID = r.Vehicle_ID
     JOIN Parking_Slot s ON s.Slot_ID = r.Slot_ID
     ORDER BY p.Payment_ID DESC`
  );
}

export function listHistory(vehicleId) {
  return query(
    `SELECT r.Receipt_ID, r.Vehicle_ID, v.Vehicle_Number, v.Vehicle_Type, s.Slot_Number,
            s.Slot_Type, rt.Rate_Per_Hour, r.Entry_Time, r.Exit_Time, r.Duration, r.Amount,
            p.Payment_Method, p.Payment_Status
     FROM Parking_Record r
     JOIN Vehicle v ON v.Vehicle_ID = r.Vehicle_ID
     JOIN Parking_Slot s ON s.Slot_ID = r.Slot_ID
     JOIN Parking_Rate rt ON rt.Rate_ID = r.Rate_ID
     LEFT JOIN Payment p ON p.Receipt_ID = r.Receipt_ID
     WHERE r.Exit_Time IS NOT NULL AND (? IS NULL OR r.Vehicle_ID = ?)
     ORDER BY r.Receipt_ID DESC`,
    [vehicleId, vehicleId]
  );
}
