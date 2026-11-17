import { ok, handle, readJson, missingFields, HttpError } from "@/lib/helpers";
import { listOwners, insertOwner } from "@/lib/queries";

export const GET = handle(async () => ok(await listOwners()));

export const POST = handle(async (request) => {
  const body = await readJson(request);
  const err = missingFields(body, ["ownerName", "phone"]);
  if (err) throw new HttpError(err);
  if (!/^\d{10}$/.test(String(body.phone))) throw new HttpError("Phone must be 10 digits");
  const id = await insertOwner(String(body.ownerName).trim(), String(body.phone), body.email?.trim());
  return ok({ Owner_ID: id }, 201);
});
