import { ObjectId } from "mongodb";
import { HttpError } from "@/lib/helpers";

export const PRIORITIES = ["Low", "Medium", "High"];
export const COMPLAINT_CATEGORIES = ["Billing", "Slot", "Staff", "Safety", "Other"];
export const COMPLAINT_STATUSES = ["Open", "In Progress", "Resolved"];
export const INCIDENT_TYPES = ["Damage", "Theft", "Accident", "Overstay", "Other"];

export function cleanText(value, field, { min = 1, max = 1000 } = {}) {
  if (typeof value !== "string") throw new HttpError(`${field} is required`, 400);
  const text = value.trim();
  if (text.length < min || text.length > max) {
    throw new HttpError(`${field} must be ${min}-${max} characters`, 400);
  }
  return text;
}

export function pickEnum(value, allowed, field, fallback) {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) return fallback;
  if (!allowed.includes(value)) throw new HttpError(`${field} must be one of: ${allowed.join(", ")}`, 400);
  return value;
}

export function optionalPositiveInt(value, field) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(`Invalid ${field}`, 400);
  return n;
}

export function parseObjectId(value) {
  if (typeof value !== "string" || value.length !== 24 || !ObjectId.isValid(value)) {
    throw new HttpError("Invalid id", 400);
  }
  return new ObjectId(value);
}
