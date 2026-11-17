import { query } from "@/lib/mysql";

export async function findOwnerByLogin(vehicleNumber, phone) {
  const rows = await query(
    `SELECT o.Owner_ID, o.Owner_Name
     FROM Owner o
     JOIN Vehicle v ON v.Owner_ID = o.Owner_ID
     WHERE v.Vehicle_Number = ? AND o.Phone = ?
     LIMIT 1`,
    [vehicleNumber, phone]
  );
  return rows[0] || null;
}

export function listHistoryForOwner(ownerId) {
  return query(
    `SELECT r.Receipt_ID, r.Vehicle_ID, v.Vehicle_Number, v.Vehicle_Type, s.Slot_Number,
            s.Slot_Type, rt.Rate_Per_Hour, r.Entry_Time, r.Exit_Time, r.Duration, r.Amount,
            p.Payment_Method, p.Payment_Status
     FROM Parking_Record r
     JOIN Vehicle v ON v.Vehicle_ID = r.Vehicle_ID
     JOIN Parking_Slot s ON s.Slot_ID = r.Slot_ID
     JOIN Parking_Rate rt ON rt.Rate_ID = r.Rate_ID
     LEFT JOIN Payment p ON p.Receipt_ID = r.Receipt_ID
     WHERE r.Exit_Time IS NOT NULL AND v.Owner_ID = ?
     ORDER BY r.Receipt_ID DESC`,
    [ownerId]
  );
}
