// All SQL lives here. Import by function name in route handlers.
// Functions that take `conn` run inside a transaction (conn.execute returns [rows, fields]).
import { query } from "@/lib/mysql";

// ---------- Health ----------
export const countSlotsByStatus = () =>
  query("SELECT Status, COUNT(*) AS Total FROM Parking_Slot GROUP BY Status");

// ---------- Owners ----------
export const listOwners = () =>
  query("SELECT Owner_ID, Owner_Name, Phone, Email FROM Owner ORDER BY Owner_Name");

export const insertOwner = async (name, phone, email) => {
  const res = await query("INSERT INTO Owner (Owner_Name, Phone, Email) VALUES (?, ?, ?)", [
    name,
    phone,
    email || null,
  ]);
  return res.insertId;
};

export const getOwnerById = async (id) =>
  (await query("SELECT * FROM Owner WHERE Owner_ID = ?", [id]))[0];

// ---------- Vehicles ----------
const VEHICLE_SELECT = `
  SELECT V.Vehicle_ID, V.Vehicle_Number, V.Vehicle_Type, V.Model,
         O.Owner_ID, O.Owner_Name, O.Phone
  FROM Vehicle V
  JOIN Owner O ON V.Owner_ID = O.Owner_ID`;

export const listVehicles = () => query(`${VEHICLE_SELECT} ORDER BY V.Vehicle_ID`);

export const getVehicleById = async (id) =>
  (await query(`${VEHICLE_SELECT} WHERE V.Vehicle_ID = ?`, [id]))[0];

export const insertVehicle = async (number, type, model, ownerId) => {
  const res = await query(
    "INSERT INTO Vehicle (Vehicle_Number, Vehicle_Type, Model, Owner_ID) VALUES (?, ?, ?, ?)",
    [number, type, model || null, ownerId]
  );
  return res.insertId;
};

export const txInsertOwner = async (conn, name, phone, email) =>
  (await conn.execute("INSERT INTO Owner (Owner_Name, Phone, Email) VALUES (?, ?, ?)", [name, phone, email || null]))[0]
    .insertId;

export const txInsertVehicle = async (conn, number, type, model, ownerId) =>
  (
    await conn.execute(
      "INSERT INTO Vehicle (Vehicle_Number, Vehicle_Type, Model, Owner_ID) VALUES (?, ?, ?, ?)",
      [number, type, model || null, ownerId]
    )
  )[0].insertId;

export const updateVehicle = (id, number, type, model, ownerId) =>
  query(
    "UPDATE Vehicle SET Vehicle_Number = ?, Vehicle_Type = ?, Model = ?, Owner_ID = ? WHERE Vehicle_ID = ?",
    [number, type, model || null, ownerId, id]
  );

export const deleteVehicle = (id) => query("DELETE FROM Vehicle WHERE Vehicle_ID = ?", [id]);

// ---------- Slots ----------
export const listSlots = () =>
  query("SELECT Slot_ID, Slot_Number, Slot_Type, Status FROM Parking_Slot ORDER BY Slot_Number");

export const listAvailableSlots = () =>
  query(
    "SELECT Slot_ID, Slot_Number, Slot_Type, Status FROM Parking_Slot WHERE Status = 'Available' ORDER BY Slot_Number"
  );

// ---------- Rates ----------
export const listRates = () =>
  query("SELECT Rate_ID, Vehicle_Type, Slot_Type, Rate_Per_Hour FROM Parking_Rate ORDER BY Vehicle_Type, Slot_Type");

// ---------- Parking entry (transaction helpers) ----------
export const txGetVehicle = async (conn, id) =>
  (await conn.execute("SELECT Vehicle_ID, Vehicle_Type FROM Vehicle WHERE Vehicle_ID = ?", [id]))[0][0];

// FOR UPDATE locks the slot row so two requests cannot take the same slot
export const txGetSlotForUpdate = async (conn, id) =>
  (await conn.execute("SELECT Slot_ID, Slot_Type, Status FROM Parking_Slot WHERE Slot_ID = ? FOR UPDATE", [id]))[0][0];

export const txGetActiveRecordForVehicle = async (conn, vehicleId) =>
  (
    await conn.execute(
      "SELECT Receipt_ID FROM Parking_Record WHERE Vehicle_ID = ? AND Exit_Time IS NULL",
      [vehicleId]
    )
  )[0][0];

export const txGetRate = async (conn, vehicleType, slotType) =>
  (
    await conn.execute(
      "SELECT Rate_ID FROM Parking_Rate WHERE Vehicle_Type = ? AND Slot_Type = ?",
      [vehicleType, slotType]
    )
  )[0][0];

export const txInsertParkingRecord = async (conn, vehicleId, slotId, rateId) =>
  (
    await conn.execute("INSERT INTO Parking_Record (Vehicle_ID, Slot_ID, Rate_ID) VALUES (?, ?, ?)", [
      vehicleId,
      slotId,
      rateId,
    ])
  )[0].insertId;

export const txSetSlotStatus = (conn, slotId, status) =>
  conn.execute("UPDATE Parking_Slot SET Status = ? WHERE Slot_ID = ?", [status, slotId]);

// ---------- Parking records ----------
const RECEIPT_SELECT = `
  SELECT P.Receipt_ID, V.Vehicle_ID, V.Vehicle_Number, V.Vehicle_Type, O.Owner_Name,
         S.Slot_ID, S.Slot_Number, S.Slot_Type,
         R.Rate_ID, R.Rate_Per_Hour,
         P.Entry_Time, P.Exit_Time, P.Duration, P.Amount
  FROM Parking_Record P
  JOIN Vehicle V ON P.Vehicle_ID = V.Vehicle_ID
  JOIN Owner O ON V.Owner_ID = O.Owner_ID
  JOIN Parking_Slot S ON P.Slot_ID = S.Slot_ID
  JOIN Parking_Rate R ON P.Rate_ID = R.Rate_ID`;

export const getReceiptById = async (id) =>
  (await query(`${RECEIPT_SELECT} WHERE P.Receipt_ID = ?`, [id]))[0];

export const listCurrentlyParked = () =>
  query(`${RECEIPT_SELECT} WHERE P.Exit_Time IS NULL ORDER BY P.Entry_Time DESC`);
