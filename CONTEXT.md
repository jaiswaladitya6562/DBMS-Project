# Parking Management System: Project Context

DBMS project. Next.js (frontend + backend route handlers) + MySQL (mysql2, NO Prisma) + MongoDB. Tailwind CSS. Deploy on Vercel.
Roles: customer (vehicle owner) and admin (parking lot owner).

## Rules (always follow)
- DB access ONLY in backend route handlers / lib. Never in browser code.
- Raw SQL via mysql2 with parameterized queries (`?`). Never concatenate user input into SQL.
- Secrets only in `.env`. Never prefix with NEXT_PUBLIC_.
- Validate all request data on the server. Check slot availability server-side.
- Parking entry and exit must use SQL transactions (record + slot status together).
- Keep SQL visible: put queries in `lib/queries.js`, import by function name.
- Output style: code only, one file at a time, minimal comments, no long explanations.

## Env vars
MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE=parking_management
MONGODB_URI, MONGODB_DATABASE=parking_management

## MySQL schema (7 tables)
OWNER(Owner_ID PK, Owner_Name, Phone, Email)
VEHICLE(Vehicle_ID PK, Vehicle_Number UNIQUE, Vehicle_Type, Model, Owner_ID FK->OWNER)
PARKING_SLOT(Slot_ID PK, Slot_Number UNIQUE, Slot_Type, Status)   -- Status: Available/Occupied/Reserved
PARKING_RATE(Rate_ID PK, Vehicle_Type, Slot_Type, Rate_Per_Hour)
PARKING_RECORD(Receipt_ID PK, Vehicle_ID FK, Slot_ID FK, Rate_ID FK, Entry_Time, Exit_Time, Duration, Amount)
PAYMENT(Payment_ID PK, Receipt_ID FK, Payment_Date, Payment_Method, Amount, Payment_Status)  -- method: Cash/UPI/Card
RESERVATION(Reservation_ID PK, Vehicle_ID FK, Slot_ID FK, Reservation_Time, Start_Time, End_Time, Status)

Relationships: OWNER 1:N VEHICLE; VEHICLE 1:N PARKING_RECORD; SLOT 1:N PARKING_RECORD; RATE 1:N PARKING_RECORD;
PARKING_RECORD 1:1 PAYMENT; VEHICLE 1:N RESERVATION; SLOT 1:N RESERVATION.

## MongoDB collections (flexible data only, do not duplicate MySQL tables)
feedback, complaints, incidents, notifications, activity_logs
Example: { vehicleId, type, message, priority, createdAt }

## API list
GET/POST /api/vehicles; GET/PUT/DELETE /api/vehicles/[id]
GET /api/slots; GET /api/slots/available; (admin) slots + /api/rates management
POST /api/parking (entry); GET /api/parking/[receiptId]; PUT /api/parking/[receiptId] (exit + fare)
POST/GET /api/payments
POST/GET /api/reservations; PUT /api/reservations/[id]
GET /api/reports/revenue; GET /api/reports/occupancy
POST /api/feedback; POST /api/complaints

## Workflows
Entry: validate vehicle + slot -> find rate (vehicle type + slot type) -> INSERT PARKING_RECORD -> slot Occupied -> return Receipt_ID.
Exit: get record by Receipt_ID -> set Exit_Time -> Duration (round up to whole hours) -> Amount = hours * rate -> UPDATE record -> record PAYMENT -> slot Available -> return receipt.

## Folder structure
app/ (dashboard, vehicles, parking, reservations, payments, history, admin, api/*)
components/ (Navbar.jsx, SlotCard.jsx, VehicleCard.jsx, ReceiptCard.jsx)
lib/ (mysql.js, mongodb.js, queries.js, helpers.js)
schema.sql, seed.sql, .env, package.json

## Build plan (one part per chat)
1. Foundation: Next.js + Tailwind, schema.sql + seed.sql, lib/mysql.js, helpers, Navbar/layout
2. Vehicles, slots, rates, parking entry + receipt (APIs + UI)
3. Parking exit, fare, payments, history (APIs + UI)
4. Reservations + admin dashboard and reports
5. MongoDB (feedback, complaints, incidents), auth + roles, testing, deploy
6. Role fixes: customer phone+password login + signup (email optional), customers see only own vehicles/parking/reservations/history, admin vehicles page read-only, feedback/complaints customer-only

## Progress (update after each part)
- [x] Part 1
- [x] Part 2
- [x] Part 3 (code delivered, user testing via UI checklist)
- [x] Part 4 (code delivered, user testing pending)
- [x] Part 5 (code delivered, testing in progress)
- [ ] Part 6 (role fixes: customer phone+password login (email optional), per-owner scoping, admin vehicles read-only, no admin feedback)

## Handoff notes (add 5 lines per finished part: files created, function names, deviations)
Part 1 (done, verified: GET /api/health returns 12 Available slots)
- Env: Windows + PowerShell, Next.js App Router, JavaScript (no TS), Tailwind, no src/ dir, alias @/*. Dark theme (default globals.css, kept). Packages: mysql2, mongodb.
- Files: schema.sql, seed.sql (project root, run via mysql `source`), .env (inside project root), lib/mysql.js, lib/helpers.js, lib/queries.js, components/Navbar.jsx, app/layout.js, app/page.js, app/api/health/route.js (temporary, can delete).
- lib/mysql.js exports: query(sql, params) -> rows (uses pool.execute, parameterized); withTransaction(async (conn) => {...}) for commit/rollback; default export pool. Inside a transaction use conn.execute(sql, params), which returns [rows].
- lib/helpers.js exports: ok(data, status), fail(message, status), handle(fn) wraps a route handler and returns JSON on errors (maps ER_DUP_ENTRY -> 409, ER_NO_REFERENCED_ROW_2 -> 400), missingFields(body, fields), isPositiveInt(v).
- lib/queries.js: all SQL goes here, currently only countSlotsByStatus(). Routes import queries by name.
- Schema notes: Duration stored in MINUTES; fare = CEIL(Duration/60) * Rate_Per_Hour. Enums: Vehicle_Type Bike/Car/SUV/Truck; Slot_Type Standard/Covered; Slot Status Available/Occupied/Reserved; Payment_Method Cash/UPI/Card; Payment_Status Paid/Pending/Failed; Reservation Status Pending/Confirmed/Cancelled/Completed. Parking_Rate unique on (Vehicle_Type, Slot_Type). Payment.Receipt_ID is UNIQUE (1:1). mysql2 pool uses dateStrings: true.
- Seed: 3 owners, 4 vehicles (Car, Bike, SUV, Truck), 12 slots (A1-A6 Standard, B1-B6 Covered), 8 rates.
- Navbar links to /dashboard /vehicles /parking /reservations /payments /history /admin (pages not built yet).
- Dev notes (Part 1): Next.js reads .env only at startup (restart after edits). In PowerShell run mysql via: & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p -e "source file.sql".

Part 2 (done, verified: parking entry created Receipt 1, GET /api/parking lists it)
- New files: lib/api.js (client fetch helper: api(url, {method, body}) returns JSON or throws Error(message)); app/api/owners/route.js (GET, POST); app/api/vehicles/route.js (GET, POST) and [id]/route.js (GET, PUT, DELETE); app/api/slots/route.js (GET all) and slots/available/route.js (GET); app/api/rates/route.js (GET); app/api/parking/route.js (GET currently parked, POST entry) and [receiptId]/route.js (GET only); components SlotCard, VehicleCard, ReceiptCard; app/vehicles/page.js, app/parking/page.js (both client components).
- helpers.js now also exports: HttpError(message, status) (throw anywhere incl. inside transactions; handle() returns it as JSON), readJson(request), VEHICLE_TYPES. handle() also maps ER_ROW_IS_REFERENCED_2 -> 409. Route files must export ONLY HTTP handlers (put shared constants in lib/).
- Route params: use `const { id } = await context.params` (Next 15+). Request bodies are camelCase (vehicleId, slotId, vehicleNumber, vehicleType, model, ownerId, ownerName, phone, email); responses use DB column names (Receipt_ID, Slot_Number, ...).
- queries.js exports (Part 2): listOwners, insertOwner, getOwnerById, listVehicles, getVehicleById, insertVehicle, updateVehicle, deleteVehicle, txInsertOwner, txInsertVehicle, listSlots, listAvailableSlots, listRates, getReceiptById, listCurrentlyParked, plus parking-entry tx helpers (conn first arg): txGetVehicle, txGetSlotForUpdate (SELECT ... FOR UPDATE), txGetActiveRecordForVehicle, txGetRate, txInsertParkingRecord, txSetSlotStatus(conn, slotId, status).
- getReceiptById / listCurrentlyParked return: Receipt_ID, Vehicle_ID, Vehicle_Number, Vehicle_Type, Owner_Name, Slot_ID, Slot_Number, Slot_Type, Rate_ID, Rate_Per_Hour, Entry_Time, Exit_Time, Duration, Amount. ReceiptCard shows all of these (status Parked when Exit_Time is null).
- Entry logic (POST /api/parking, body {vehicleId, slotId}): in one withTransaction: vehicle exists -> lock slot FOR UPDATE, must be Available (409) -> vehicle must not already be parked (409) -> rate by vehicle+slot type -> INSERT record -> slot Occupied -> 201 with receipt.
- Validation: vehicle number uppercased, spaces stripped, /^[A-Z0-9-]{4,20}$/; phone /^\d{10}$/. POST /api/vehicles accepts ownerId OR ownerName+phone(+email) and creates the owner in the same transaction.
- Not built yet: admin slot/rate management (Part 4), PUT exit/fare (Part 3), receipt lookup page, history page. UI styling: dark cards (bg-slate-900, border-slate-700), emerald buttons, rupee symbol.

Part 3 (code delivered as part3.zip; verification pending: exit, payment, history flows)
- New files: lib/queries3.js (Part 3 SQL, separate because queries.js was not visible; may be merged into queries.js), lib/constants.js (PAYMENT_METHODS = Cash/UPI/Card), app/api/payments/route.js (GET, POST), app/api/history/route.js (GET, optional ?vehicleId=), app/parking/exit/page.js, app/payments/page.js, app/history/page.js. REPLACED app/api/parking/[receiptId]/route.js (now GET + PUT).
- queries3.js exports: txGetRecordForUpdate (record + Rate_Per_Hour + Amount, FOR UPDATE), txCloseRecord(conn, receiptId, ratePerHour), txGetRecordAmount, txGetPaymentForUpdate, txInsertPayment(conn, receiptId, method, amount, status), txMarkPaymentPaid(conn, paymentId, method), getPaymentByReceiptId, listPayments, listHistory(vehicleId|null). tx helpers return a row (not [rows]).
- Exit logic (PUT /api/parking/[receiptId], body {paymentMethod?}): one withTransaction: lock record (404 if missing, 409 if already exited) -> UPDATE Exit_Time=NOW(), Duration=CEIL(seconds/60) minutes, Amount=GREATEST(1, CEIL(seconds/3600)) * rate (1 hour minimum) -> INSERT PAYMENT (Paid if paymentMethod given, else Pending with method Cash) -> slot Available. GET /api/parking/[receiptId] now returns receipt plus Payment (or null).
- POST /api/payments body {receiptId, paymentMethod}: record must have exited (409), already Paid -> 409; existing Pending/Failed payment is updated to Paid, else a new Paid payment is inserted (201).
- Assumptions made: handle(async (request, context) => ...) usage; ok(data) returns raw JSON (pages expect arrays/objects, not {data}); Payment_Date set with NOW(). Exit page is at /parking/exit and is not in the Navbar yet. Not built: receipt lookup page, admin slot/rate management (Part 4).

Part 4 (code delivered as part4.zip; verification pending: reservations, admin, reports, dashboard)
- New files: lib/queries4.js (Part 4 SQL), lib/datetime.js (normalizeDateTime -> 'YYYY-MM-DD HH:mm:ss' or null), app/api/reservations/route.js (GET, POST) and [id]/route.js (GET, PUT), app/api/slots/[id]/route.js (GET, PUT, DELETE), app/api/rates/[id]/route.js (PUT, DELETE), app/api/reports/revenue/route.js, app/api/reports/occupancy/route.js, app/reservations/page.js, app/dashboard/page.js, app/admin/page.js.
- REPLACED: lib/constants.js (PAYMENT_METHODS, SLOT_TYPES, RESERVATION_STATUSES, RESERVATION_TRANSITIONS), app/api/slots/route.js (GET + POST), app/api/rates/route.js (GET + POST upsert by vehicleType+slotType).
- queries4.js exports: listReservations, getReservationById, txGetVehicleId, txGetSlotLocked, txIsNotPast, txCountOverlaps, txInsertReservation, txGetReservationForUpdate, txSetReservationStatus, insertSlot, getSlotById, txUpdateSlot, deleteSlot, getRateById, upsertRate, updateRate, deleteRate, revenueTotals, revenueByDay, revenueByMethod, revenueByVehicleType, occupancyBySlotType, countActiveReservations. tx helpers return a row/value (not [rows]).
- Reservation logic: POST body {vehicleId, slotId, startTime, endTime} in one tx: vehicle exists (404) -> lock slot, must be Available (409) -> start not >5 min in past (400) -> no overlapping Pending/Confirmed reservation (409) -> INSERT status Confirmed -> slot Reserved. PUT body {status}: transitions Pending->Confirmed/Cancelled/Completed, Confirmed->Cancelled/Completed, others final (409); Cancelled/Completed set a Reserved slot back to Available.
- Admin: POST /api/slots {slotNumber, slotType}; PUT /api/slots/[id] {slotType?, status? (Available/Reserved only)}, Occupied slots cannot be edited or deleted (409); POST /api/rates {vehicleType, slotType, ratePerHour}; PUT /api/rates/[id] {ratePerHour}; deleting a rate used by records returns 409 via handle().
- Reports: revenue -> {totalPaid, totalPending, todayPaid, paymentCount, byDay (30 days), byMethod, byVehicleType}; occupancy -> {total, available, occupied, reserved, occupancyPercent, activeReservations, bySlotType[]}. Numbers are cast to Number.
- Known limits: parking entry (Part 2) still requires an Available slot, so a reserved vehicle cannot park in its Reserved slot until the reservation is completed/cancelled; no automatic slot release on reservation end; datetime-local values are read in MySQL server time zone; no auth yet (Part 5: admin pages /admin should be role-protected). Navbar already links /dashboard /reservations /admin; /parking/exit still not linked.
- Remaining: Part 5 = MongoDB (feedback, complaints, incidents, notifications, activity_logs; POST /api/feedback, POST /api/complaints), auth + roles, testing, Vercel deploy.

Part 5 (code delivered as part5.zip; verification in progress)
- New files: lib/mongodb.js (getDb(), cached client), lib/session.js (HMAC-signed cookie "pms_session", 8h, Web Crypto so it runs in middleware: createToken, verifyToken), lib/auth.js (getSession(request), requireSession(request, role?) -> 401/403 HttpError), lib/activity.js (logActivity(action, actor, details) -> activity_logs, never throws), lib/validate.js (cleanText, pickEnum, optionalPositiveInt, parseObjectId, PRIORITIES, COMPLAINT_CATEGORIES, COMPLAINT_STATUSES, INCIDENT_TYPES), lib/queries5.js (findOwnerByLogin(vehicleNumber, phone), listHistoryForOwner(ownerId)), middleware.js, components/Navbar.jsx (REPLACED, role-aware, logout), app/login/page.js, app/feedback/page.js, app/admin/inbox/page.js, app/history/page.js (REPLACED), scripts/smoke-test.mjs, .env.example.
- API: app/api/auth/login (POST), logout (POST), me (GET -> {user|null}); app/api/feedback (GET admin, POST), complaints (GET admin, POST) and complaints/[id] (PUT admin), incidents (GET, POST admin), notifications (GET own+broadcast, POST admin), activity (GET admin). REPLACED: app/api/history/route.js (customer gets own stays only), app/api/parking/[receiptId]/route.js (PUT exit now admin-only + logs parking_exit).
- Auth model (CURRENT, to be changed in Part 6): admin = single shared ADMIN_PASSWORD from .env; customer = vehicleNumber + OWNER.Phone (10 digits). Session payload {role, ownerId?, name, exp}. Env added: AUTH_SECRET (32+ chars), ADMIN_PASSWORD. MONGODB_URI can be local (mongodb://127.0.0.1:27017) or Atlas (needed for Vercel).
- Middleware rules: no session -> pages redirect /login?next=, API 401. Customer blocked (403/redirect) from pages /admin /dashboard /payments /parking/exit and API /api/reports, /api/payments, /api/activity, /api/incidents, /api/health (all methods); writes to /api/slots, /api/rates; PUT /api/parking/*; GET /api/feedback; GET/PUT /api/complaints; POST /api/notifications.
- Mongo collections in use: feedback {ownerId, vehicleId, rating, message, createdAt}, complaints {ownerId, vehicleId, category, message, priority, status Open/In Progress/Resolved, adminNote, createdAt, updatedAt}, incidents {type, vehicleId, slotNumber, message, priority, createdAt}, notifications {ownerId|null=broadcast, message, priority, createdAt}, activity_logs {action, actor{role, ownerId}, details, createdAt}.
- Known gaps (Part 6 fixes these): customers can still list ALL vehicles (/api/vehicles), ALL currently parked (/api/parking GET), ALL reservations, any receipt (/api/parking/[receiptId] GET); POST /api/parking and POST /api/reservations do not check the vehicle belongs to the caller; admin can submit feedback/complaints; admin sees add-vehicle form; no login rate limiting; no signup flow.

Current status (2026-11-01)
- Parts 3, 4, 5 code delivered; UI/API verification by user still in progress (none confirmed verified yet).
- Setup issues hit: admin login needs ADMIN_PASSWORD + AUTH_SECRET in .env and a server restart; customer login needs a vehicle number + phone that exist in MySQL; MongoDB must be running (local service or Atlas) for feedback/complaints/incidents/notifications/activity and for login activity logging (logging failure does not block login).

Part 6 plan (user requirements, not built yet)
1. Admin must not give feedback/complaints: hide Feedback link for admin; POST /api/feedback and POST /api/complaints customer-only (admin -> 403); /feedback page customer-only in middleware. Admin keeps /admin/inbox (read, update complaint status, incidents, notifications, activity).
2. Customer login = phone + password (email optional, not used for login). Needs: OWNER.Password_Hash column (scrypt via node crypto, no new dependency), OWNER.Phone NOT NULL UNIQUE (10 digits; migration must first check existing owners for duplicate phones), OWNER.Email stays optional (nullable; if given, validate format, no unique requirement), migration SQL, script to set passwords for seeded owners, POST /api/auth/register (name, phone, password, optional email), signup page (email field optional), login form changed to phone+password, login rate limiting (per phone+IP). Admin login stays ADMIN_PASSWORD. Min password length 8.
3. Customer sees only their own data: vehicles (list/create/update/delete scoped by session ownerId; create no longer takes ownerName/phone), currently parked, parking entry page vehicle dropdown (own vehicles only; server verifies vehicle belongs to caller and slot is Available), receipts GET (own only), reservations (list own, POST verifies vehicle ownership), history (already scoped). Slot list stays global (needed to choose a slot) but shows no other owner's info.
4. Admin /vehicles page: read-only list of all registered vehicles (vehicle, type, model, owner name/phone); no add/edit/delete form. Customers use the same page as "My Vehicles" with add/edit/delete.
- Needs from user before building: current app/api/vehicles/route.js, app/api/vehicles/[id]/route.js, app/api/parking/route.js, app/vehicles/page.js, app/parking/page.js, lib/queries.js, schema.sql (Part 2 files were not visible in later chats).
