import { query } from "@/lib/mysql";

const first = ([rows]) => rows[0] || null;

/* Reservations */

const RESERVATION_SELECT = `
  SELECT rv.Reservation_ID, rv.Vehicle_ID, v.Vehicle_Number, v.Vehicle_Type,
         rv.Slot_ID, s.Slot_Number, s.Slot_Type,
         rv.Reservation_Time, rv.Start_Time, rv.End_Time, rv.Status
  FROM Reservation rv
  JOIN Vehicle v ON v.Vehicle_ID = rv.Vehicle_ID
  JOIN Parking_Slot s ON s.Slot_ID = rv.Slot_ID`;

export function listReservations() {
  return query(`${RESERVATION_SELECT} ORDER BY rv.Reservation_ID DESC`);
}

export async function getReservationById(id) {
  const rows = await query(`${RESERVATION_SELECT} WHERE rv.Reservation_ID = ?`, [id]);
  return rows[0] || null;
}

export function txGetVehicleId(conn, vehicleId) {
  return conn
    .execute(`SELECT Vehicle_ID FROM Vehicle WHERE Vehicle_ID = ?`, [vehicleId])
    .then(first);
}

export function txGetSlotLocked(conn, slotId) {
  return conn
    .execute(
      `SELECT Slot_ID, Slot_Number, Slot_Type, Status
       FROM Parking_Slot WHERE Slot_ID = ? FOR UPDATE`,
      [slotId]
    )
    .then(first);
}

export function txIsNotPast(conn, startTime) {
  return conn
    .execute(`SELECT (? >= NOW() - INTERVAL 5 MINUTE) AS Ok`, [startTime])
    .then(([rows]) => Number(rows[0].Ok) === 1);
}

export function txCountOverlaps(conn, slotId, startTime, endTime) {
  return conn
    .execute(
      `SELECT COUNT(*) AS Cnt FROM Reservation
       WHERE Slot_ID = ? AND Status IN ('Pending', 'Confirmed')
         AND Start_Time < ? AND End_Time > ?`,
      [slotId, endTime, startTime]
    )
    .then(([rows]) => Number(rows[0].Cnt));
}

export function txInsertReservation(conn, vehicleId, slotId, startTime, endTime) {
  return conn
    .execute(
      `INSERT INTO Reservation (Vehicle_ID, Slot_ID, Reservation_Time, Start_Time, End_Time, Status)
       VALUES (?, ?, NOW(), ?, ?, 'Confirmed')`,
      [vehicleId, slotId, startTime, endTime]
    )
    .then(([r]) => r.insertId);
}

export function txGetReservationForUpdate(conn, id) {
  return conn
    .execute(
      `SELECT Reservation_ID, Slot_ID, Status FROM Reservation
       WHERE Reservation_ID = ? FOR UPDATE`,
      [id]
    )
    .then(first);
}

export function txSetReservationStatus(conn, id, status) {
  return conn.execute(`UPDATE Reservation SET Status = ? WHERE Reservation_ID = ?`, [status, id]);
}

/* Slots (admin) */

export async function insertSlot(slotNumber, slotType) {
  const rows = await query(
    `INSERT INTO Parking_Slot (Slot_Number, Slot_Type, Status) VALUES (?, ?, 'Available')`,
    [slotNumber, slotType]
  );
  return rows.insertId;
}

export async function getSlotById(id) {
  const rows = await query(`SELECT * FROM Parking_Slot WHERE Slot_ID = ?`, [id]);
  return rows[0] || null;
}

export function txUpdateSlot(conn, id, slotType, status) {
  return conn.execute(`UPDATE Parking_Slot SET Slot_Type = ?, Status = ? WHERE Slot_ID = ?`, [
    slotType,
    status,
    id,
  ]);
}

export function deleteSlot(id) {
  return query(`DELETE FROM Parking_Slot WHERE Slot_ID = ?`, [id]);
}

/* Rates (admin) */

export async function getRateById(id) {
  const rows = await query(`SELECT * FROM Parking_Rate WHERE Rate_ID = ?`, [id]);
  return rows[0] || null;
}

export function upsertRate(vehicleType, slotType, ratePerHour) {
  return query(
    `INSERT INTO Parking_Rate (Vehicle_Type, Slot_Type, Rate_Per_Hour) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE Rate_Per_Hour = VALUES(Rate_Per_Hour)`,
    [vehicleType, slotType, ratePerHour]
  );
}

export function updateRate(id, ratePerHour) {
  return query(`UPDATE Parking_Rate SET Rate_Per_Hour = ? WHERE Rate_ID = ?`, [ratePerHour, id]);
}

export function deleteRate(id) {
  return query(`DELETE FROM Parking_Rate WHERE Rate_ID = ?`, [id]);
}

/* Reports */

export async function revenueTotals() {
  const rows = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN Payment_Status = 'Paid' THEN Amount END), 0) AS Total_Paid,
       COALESCE(SUM(CASE WHEN Payment_Status = 'Pending' THEN Amount END), 0) AS Total_Pending,
       COALESCE(SUM(CASE WHEN Payment_Status = 'Paid' AND DATE(Payment_Date) = CURDATE()
                         THEN Amount END), 0) AS Today_Paid,
       COUNT(*) AS Payment_Count
     FROM Payment`
  );
  return rows[0];
}

export function revenueByDay() {
  return query(
    `SELECT DATE(Payment_Date) AS Day, SUM(Amount) AS Revenue, COUNT(*) AS Payments
     FROM Payment
     WHERE Payment_Status = 'Paid' AND Payment_Date >= CURDATE() - INTERVAL 29 DAY
     GROUP BY DATE(Payment_Date)
     ORDER BY Day DESC`
  );
}

export function revenueByMethod() {
  return query(
    `SELECT Payment_Method, SUM(Amount) AS Revenue, COUNT(*) AS Payments
     FROM Payment WHERE Payment_Status = 'Paid'
     GROUP BY Payment_Method ORDER BY Revenue DESC`
  );
}

export function revenueByVehicleType() {
  return query(
    `SELECT v.Vehicle_Type, SUM(p.Amount) AS Revenue, COUNT(*) AS Payments
     FROM Payment p
     JOIN Parking_Record r ON r.Receipt_ID = p.Receipt_ID
     JOIN Vehicle v ON v.Vehicle_ID = r.Vehicle_ID
     WHERE p.Payment_Status = 'Paid'
     GROUP BY v.Vehicle_Type ORDER BY Revenue DESC`
  );
}

export function occupancyBySlotType() {
  return query(
    `SELECT Slot_Type,
            COUNT(*) AS Total,
            COUNT(CASE WHEN Status = 'Available' THEN 1 END) AS Available,
            COUNT(CASE WHEN Status = 'Occupied' THEN 1 END) AS Occupied,
            COUNT(CASE WHEN Status = 'Reserved' THEN 1 END) AS Reserved
     FROM Parking_Slot GROUP BY Slot_Type`
  );
}

export async function countActiveReservations() {
  const rows = await query(
    `SELECT COUNT(*) AS Cnt FROM Reservation WHERE Status IN ('Pending', 'Confirmed')`
  );
  return Number(rows[0].Cnt);
}
