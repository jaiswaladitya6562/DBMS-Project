DROP DATABASE IF EXISTS parking_management;
CREATE DATABASE parking_management;
USE parking_management;

CREATE TABLE Owner (
  Owner_ID    INT AUTO_INCREMENT PRIMARY KEY,
  Owner_Name  VARCHAR(100) NOT NULL,
  Phone       VARCHAR(15)  NOT NULL UNIQUE,
  Email       VARCHAR(100),
  Password_Hash VARCHAR(255) NULL
);

CREATE TABLE Vehicle (
  Vehicle_ID     INT AUTO_INCREMENT PRIMARY KEY,
  Vehicle_Number VARCHAR(20) NOT NULL UNIQUE,
  Vehicle_Type   ENUM('Bike','Car','SUV','Truck') NOT NULL,
  Model          VARCHAR(50),
  Owner_ID       INT NOT NULL,
  FOREIGN KEY (Owner_ID) REFERENCES Owner(Owner_ID)
);

CREATE TABLE Parking_Slot (
  Slot_ID     INT AUTO_INCREMENT PRIMARY KEY,
  Slot_Number VARCHAR(10) NOT NULL UNIQUE,
  Slot_Type   ENUM('Standard','Covered') NOT NULL,
  Status      ENUM('Available','Occupied','Reserved') NOT NULL DEFAULT 'Available'
);

CREATE TABLE Parking_Rate (
  Rate_ID       INT AUTO_INCREMENT PRIMARY KEY,
  Vehicle_Type  ENUM('Bike','Car','SUV','Truck') NOT NULL,
  Slot_Type     ENUM('Standard','Covered') NOT NULL,
  Rate_Per_Hour DECIMAL(8,2) NOT NULL,
  UNIQUE (Vehicle_Type, Slot_Type)
);

-- Duration is stored in minutes; fare = CEIL(Duration/60) * Rate_Per_Hour
CREATE TABLE Parking_Record (
  Receipt_ID INT AUTO_INCREMENT PRIMARY KEY,
  Vehicle_ID INT NOT NULL,
  Slot_ID    INT NOT NULL,
  Rate_ID    INT NOT NULL,
  Entry_Time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Exit_Time  DATETIME NULL,
  Duration   INT NULL,
  Amount     DECIMAL(10,2) NULL,
  FOREIGN KEY (Vehicle_ID) REFERENCES Vehicle(Vehicle_ID),
  FOREIGN KEY (Slot_ID)    REFERENCES Parking_Slot(Slot_ID),
  FOREIGN KEY (Rate_ID)    REFERENCES Parking_Rate(Rate_ID)
);

CREATE TABLE Payment (
  Payment_ID     INT AUTO_INCREMENT PRIMARY KEY,
  Receipt_ID     INT NOT NULL UNIQUE,
  Payment_Date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Payment_Method ENUM('Cash','UPI','Card') NOT NULL,
  Amount         DECIMAL(10,2) NOT NULL,
  Payment_Status ENUM('Paid','Pending','Failed') NOT NULL DEFAULT 'Paid',
  FOREIGN KEY (Receipt_ID) REFERENCES Parking_Record(Receipt_ID)
);

CREATE TABLE Reservation (
  Reservation_ID   INT AUTO_INCREMENT PRIMARY KEY,
  Vehicle_ID       INT NOT NULL,
  Slot_ID          INT NOT NULL,
  Reservation_Time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Start_Time       DATETIME NOT NULL,
  End_Time         DATETIME NOT NULL,
  Status           ENUM('Pending','Confirmed','Cancelled','Completed') NOT NULL DEFAULT 'Pending',
  FOREIGN KEY (Vehicle_ID) REFERENCES Vehicle(Vehicle_ID),
  FOREIGN KEY (Slot_ID)    REFERENCES Parking_Slot(Slot_ID),
  CHECK (End_Time > Start_Time)
);
