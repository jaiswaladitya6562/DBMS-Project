import { query } from "@/lib/mysql";

// ---------- Owner accounts ----------
export async function findOwnerByPhone(phone) {
  const rows = await query(
    "SELECT Owner_ID, Owner_Name, Password_Hash FROM Owner WHERE Phone = ?",
    [phone]
  );
  return rows[0] || null;
}

export async function insertOwnerAccount(name, phone, email, passwordHash) {
  const res = await query(
    "INSERT INTO Owner (Owner_Name, Phone, Email, Password_Hash) VALUES (?, ?, ?, ?)",
    [name, phone, email || null, passwordHash]
  );
  return res.insertId;
}

// ---------- Vehicles of one owner ----------
export function listVehiclesByOwner(ownerId) {
  return query(
    `SELECT V.Vehicle_ID, V.Vehicle_Number, V.Vehicle_Type, V.Model,
            O.Owner_ID, O.Owner_Name, O.Phone
     FROM Vehicle V
     JOIN Owner O ON V.Owner_ID = O.Owner_ID
     WHERE V.Owner_ID = ?
     ORDER BY V.Vehicle_ID`,
    [ownerId]
  );
}

// ---------- Parking records with owner (for access checks) ----------
const RECEIPT_SELECT = `
  SELECT P.Receipt_ID, V.Vehicle_ID, V.Vehicle_Number, V.Vehicle_Type, V.Owner_ID, O.Owner_Name,
         S.Slot_ID, S.Slot_Number, S.Slot_Type,
         R.Rate_ID, R.Rate_Per_Hour,
         P.Entry_Time, P.Exit_Time, P.Duration, P.Amount
  FROM Parking_Record P
  JOIN Vehicle V ON P.Vehicle_ID = V.Vehicle_ID
  JOIN Owner O ON V.Owner_ID = O.Owner_ID
  JOIN Parking_Slot S ON P.Slot_ID = S.Slot_ID
  JOIN Parking_Rate R ON P.Rate_ID = R.Rate_ID`;

export async function getReceiptByIdWithOwner(id) {
  const rows = await query(`${RECEIPT_SELECT} WHERE P.Receipt_ID = ?`, [id]);
  return rows[0] || null;
}

export function listCurrentlyParkedByOwner(ownerId) {
  return query(
    `${RECEIPT_SELECT} WHERE P.Exit_Time IS NULL AND V.Owner_ID = ? ORDER BY P.Entry_Time DESC`,
    [ownerId]
  );
}

// ---------- Reservations of one owner ----------
export function listReservationsByOwner(ownerId) {
  return query(
    `SELECT rv.Reservation_ID, rv.Vehicle_ID, v.Vehicle_Number, v.Vehicle_Type,
            rv.Slot_ID, s.Slot_Number, s.Slot_Type,
            rv.Reservation_Time, rv.Start_Time, rv.End_Time, rv.Status
     FROM Reservation rv
     JOIN Vehicle v ON v.Vehicle_ID = rv.Vehicle_ID
     JOIN Parking_Slot s ON s.Slot_ID = rv.Slot_ID
     WHERE v.Owner_ID = ?
     ORDER BY rv.Reservation_ID DESC`,
    [ownerId]
  );
}
