export const PAYMENT_METHODS = ["Cash", "UPI", "Card"];
export const SLOT_TYPES = ["Standard", "Covered"];
export const RESERVATION_STATUSES = ["Pending", "Confirmed", "Cancelled", "Completed"];

export const RESERVATION_TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled", "Completed"],
  Confirmed: ["Cancelled", "Completed"],
  Cancelled: [],
  Completed: [],
};
