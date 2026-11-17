import { ok, handle, HttpError, readJson } from "@/lib/helpers";
import { getRateById, updateRate, deleteRate } from "@/lib/queries4";

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError("Invalid rate id", 400);
  return id;
}

export const PUT = handle(async (request, context) => {
  const id = parseId((await context.params).id);
  const body = await readJson(request);
  const ratePerHour = Number(body?.ratePerHour);
  if (!Number.isFinite(ratePerHour) || ratePerHour <= 0 || ratePerHour > 100000) {
    throw new HttpError("ratePerHour must be a positive number", 400);
  }
  if (!(await getRateById(id))) throw new HttpError("Rate not found", 404);
  await updateRate(id, ratePerHour);
  return ok(await getRateById(id));
});

export const DELETE = handle(async (request, context) => {
  const id = parseId((await context.params).id);
  if (!(await getRateById(id))) throw new HttpError("Rate not found", 404);
  await deleteRate(id);
  return ok({ deleted: true });
});
