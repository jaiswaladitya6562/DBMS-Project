"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ParkingPage() {
  const [vehicles, setVehicles] = useState([]);
  const [slots, setSlots] = useState([]);
  const [parked, setParked] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [slotId, setSlotId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [v, s, p] = await Promise.all([api("/api/vehicles"), api("/api/slots/available"), api("/api/parking")]);
      setVehicles(v);
      setSlots(s);
      setParked(p);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const parkedIds = new Set(parked.map((p) => p.Vehicle_ID));
  const free = vehicles.filter((v) => !parkedIds.has(v.Vehicle_ID));

  async function park(e) {
    e.preventDefault();
    setError("");
    setReceipt(null);
    if (!vehicleId || !slotId) {
      setError("Choose a vehicle and a slot");
      return;
    }
    setBusy(true);
    try {
      const data = await api("/api/parking", {
        method: "POST",
        body: { vehicleId: Number(vehicleId), slotId },
      });
      setReceipt(data);
      setVehicleId("");
      setSlotId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      await load();
    }
  }

  const groups = ["Standard", "Covered"];

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Parking</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      {receipt && (
        <div className="rounded-lg border border-emerald-700 bg-slate-900 p-4 space-y-1">
          <h2 className="font-semibold text-emerald-400">Parked: Receipt #{receipt.Receipt_ID}</h2>
          <p>
            {receipt.Vehicle_Number} ({receipt.Vehicle_Type}) in slot {receipt.Slot_Number} ({receipt.Slot_Type})
          </p>
          <p>Entry: {receipt.Entry_Time}</p>
          <p>Rate: ₹{receipt.Rate_Per_Hour} per hour</p>
        </div>
      )}

      <form onSubmit={park} className="space-y-4 rounded-lg border border-slate-700 bg-slate-900 p-4">
        <div>
          <label className="mb-1 block text-sm text-slate-400">Vehicle</label>
          <select
            className="w-full rounded border border-slate-600 bg-slate-800 p-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">{free.length ? "Select a vehicle" : "No vehicle available to park"}</option>
            {free.map((v) => (
              <option key={v.Vehicle_ID} value={v.Vehicle_ID}>
                {v.Vehicle_Number} ({v.Vehicle_Type}){v.Owner_Name && vehicles.some((x) => x.Owner_ID !== v.Owner_ID) ? ` - ${v.Owner_Name}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-slate-400">Choose a free slot</p>
          {slots.length === 0 && <p className="text-slate-400">No free slots right now.</p>}
          {groups.map((g) => {
            const list = slots.filter((s) => s.Slot_Type === g);
            if (list.length === 0) return null;
            return (
              <div key={g}>
                <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">{g}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {list.map((s) => (
                    <button
                      type="button"
                      key={s.Slot_ID}
                      onClick={() => setSlotId(s.Slot_ID)}
                      className={`rounded-lg border p-3 text-center ${
                        slotId === s.Slot_ID
                          ? "border-emerald-500 bg-emerald-950 text-emerald-300"
                          : "border-slate-600 bg-slate-800 hover:border-emerald-600"
                      }`}
                    >
                      <span className="text-lg font-semibold">{s.Slot_Number}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          disabled={busy || !vehicleId || !slotId}
          className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {busy ? "Parking..." : "Park vehicle"}
        </button>
      </form>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Currently parked</h2>
        {parked.length === 0 && <p className="text-slate-400">No vehicles are parked.</p>}
        {parked.map((p) => (
          <div key={p.Receipt_ID} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
            <p className="font-medium">
              #{p.Receipt_ID} · {p.Vehicle_Number} ({p.Vehicle_Type})
            </p>
            <p className="text-sm text-slate-400">
              Slot {p.Slot_Number} ({p.Slot_Type}) · Since {p.Entry_Time} · ₹{p.Rate_Per_Hour}/hr
            </p>
          </div>
        ))}
        <p className="text-sm text-slate-500">Exit and payment are handled by the parking staff at the gate.</p>
      </section>
    </main>
  );
}
