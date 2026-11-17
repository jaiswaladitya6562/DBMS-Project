"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const badge = {
  Pending: "text-amber-400",
  Confirmed: "text-emerald-400",
  Cancelled: "text-red-400",
  Completed: "text-slate-400",
};

export default function ReservationsPage() {
  const [role, setRole] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [slots, setSlots] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ vehicleId: "", slotId: "", startTime: "", endTime: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [v, s, r] = await Promise.all([
        api("/api/vehicles"),
        api("/api/slots/available"),
        api("/api/reservations"),
      ]);
      setVehicles(v);
      setSlots(s);
      setRows(r);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role ?? null));
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const created = await api("/api/reservations", {
        method: "POST",
        body: {
          vehicleId: Number(form.vehicleId),
          slotId: Number(form.slotId),
          startTime: form.startTime,
          endTime: form.endTime,
        },
      });
      setMessage(`Reservation #${created.Reservation_ID} confirmed for slot ${created.Slot_Number}`);
      setForm({ vehicleId: "", slotId: "", startTime: "", endTime: "" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function setStatus(id, status) {
    setError("");
    setMessage("");
    try {
      await api(`/api/reservations/${id}`, { method: "PUT", body: { status } });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const input = "w-full rounded border border-slate-600 bg-slate-800 p-2";

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{role === "customer" ? "My Reservations" : "Reservations"}</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}
      {message && <p className="rounded bg-emerald-950 border border-emerald-800 p-3 text-emerald-300">{message}</p>}

      <form onSubmit={submit} className="grid gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:grid-cols-2">
        <select className={input} required value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}>
          <option value="">Select vehicle</option>
          {vehicles.map((v) => (
            <option key={v.Vehicle_ID} value={v.Vehicle_ID}>
              {v.Vehicle_Number} ({v.Vehicle_Type})
            </option>
          ))}
        </select>
        <select className={input} required value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })}>
          <option value="">Select available slot</option>
          {slots.map((s) => (
            <option key={s.Slot_ID} value={s.Slot_ID}>
              {s.Slot_Number} ({s.Slot_Type})
            </option>
          ))}
        </select>
        <label className="text-sm text-slate-400">
          Start
          <input type="datetime-local" required className={input} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        </label>
        <label className="text-sm text-slate-400">
          End
          <input type="datetime-local" required className={input} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        </label>
        <button className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 sm:col-span-2">
          Reserve slot
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Slot</th>
              <th className="p-3">Start</th>
              <th className="p-3">End</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-slate-400" colSpan={7}>No reservations yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.Reservation_ID} className="border-t border-slate-700 bg-slate-900">
                <td className="p-3">#{r.Reservation_ID}</td>
                <td className="p-3">{r.Vehicle_Number}</td>
                <td className="p-3">{r.Slot_Number} ({r.Slot_Type})</td>
                <td className="p-3">{r.Start_Time}</td>
                <td className="p-3">{r.End_Time}</td>
                <td className={`p-3 ${badge[r.Status]}`}>{r.Status}</td>
                <td className="p-3 space-x-2">
                  {(r.Status === "Pending" || r.Status === "Confirmed") && (
                    <>
                      {role === "admin" && (
                        <button onClick={() => setStatus(r.Reservation_ID, "Completed")} className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600">
                          Complete
                        </button>
                      )}
                      <button onClick={() => setStatus(r.Reservation_ID, "Cancelled")} className="rounded bg-red-700 px-3 py-1 hover:bg-red-600">
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
