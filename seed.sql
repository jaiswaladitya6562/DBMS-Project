USE parking_management;

-- Demo accounts: log in with the phone number and password Demo@1234 (change it with scripts/set-password.mjs)
INSERT INTO Owner (Owner_Name, Phone, Email, Password_Hash) VALUES
('Rahul Sharma', '9876543210', 'rahul@example.com', 'scrypt$1e3dbd38f3a61bb52883ea25a3514699$f4fc943b46ad025950db2575f590a9b1386e2222e554775b7f3541cc6f4bb785a0e02110dd47230c0c04e43c41e92e582aa81822ef9cc38e64bd6ff539b384c8'),
('Priya Nair',   '9123456780', 'priya@example.com', 'scrypt$1e3dbd38f3a61bb52883ea25a3514699$f4fc943b46ad025950db2575f590a9b1386e2222e554775b7f3541cc6f4bb785a0e02110dd47230c0c04e43c41e92e582aa81822ef9cc38e64bd6ff539b384c8'),
('Arjun Reddy',  '9988776655', 'arjun@example.com', 'scrypt$1e3dbd38f3a61bb52883ea25a3514699$f4fc943b46ad025950db2575f590a9b1386e2222e554775b7f3541cc6f4bb785a0e02110dd47230c0c04e43c41e92e582aa81822ef9cc38e64bd6ff539b384c8');

INSERT INTO Vehicle (Vehicle_Number, Vehicle_Type, Model, Owner_ID) VALUES
('KA01AB1234', 'Car',   'Honda City',     1),
('KA05CD5678', 'Bike',  'Royal Enfield',  1),
('KA03EF9012', 'SUV',   'Hyundai Creta',  2),
('KA09GH3456', 'Truck', 'Tata Ace',       3);

INSERT INTO Parking_Slot (Slot_Number, Slot_Type) VALUES
('A1','Standard'),('A2','Standard'),('A3','Standard'),('A4','Standard'),('A5','Standard'),('A6','Standard'),
('B1','Covered'),('B2','Covered'),('B3','Covered'),('B4','Covered'),('B5','Covered'),('B6','Covered');

INSERT INTO Parking_Rate (Vehicle_Type, Slot_Type, Rate_Per_Hour) VALUES
('Bike',  'Standard', 10.00),
('Bike',  'Covered',  15.00),
('Car',   'Standard', 30.00),
('Car',   'Covered',  45.00),
('SUV',   'Standard', 40.00),
('SUV',   'Covered',  60.00),
('Truck', 'Standard', 70.00),
('Truck', 'Covered',  100.00);
