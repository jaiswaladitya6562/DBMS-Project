import { NextResponse } from "next/server";

export const VEHICLE_TYPES = ["Bike", "Car", "SUV", "Truck"];

export function ok(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Throw this anywhere (including inside transactions) to return a clean error
export class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

// Parse the JSON body; throws HttpError(400) if it is missing or invalid
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError("Request body must be valid JSON", 400);
  }
}

// Wrap a route handler so errors return clean JSON
export function handle(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.message, err.status);
      console.error(err);
      if (err.code === "ER_DUP_ENTRY") return fail("Duplicate value", 409);
      if (err.code === "ER_NO_REFERENCED_ROW_2") return fail("Referenced record does not exist", 400);
      if (err.code === "ER_ROW_IS_REFERENCED_2") return fail("Cannot delete: record is in use", 409);
      return fail("Internal server error", 500);
    }
  };
}

// Returns an error message if any field is missing/empty, otherwise null
export function missingFields(body, fields) {
  const missing = fields.filter(
    (f) => body?.[f] === undefined || body[f] === null || String(body[f]).trim() === ""
  );
  return missing.length ? `Missing required field(s): ${missing.join(", ")}` : null;
}

export function isPositiveInt(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}
