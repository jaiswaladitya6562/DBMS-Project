"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const VEHICLE_TYPES = ["Bike", "Car", "SUV", "Truck"];
const SLOT_TYPES = ["Standard", "Covered"];
const input = "rounded border border-slate-600 bg-slate-800 p-2";
const th = "p-3";
const td = "p-3";

export default function AdminPage() {
  const [slots, setSlots] = useState([]);
  const [rates, setRates] = useState([]);
  const [rev, setRev] = useState(null);
  const [slotForm, setSlotForm] = useState({ slotNumber: "", slotType: "Standard" });
  const [rateForm, setRateForm] = useState({ vehicleType: "Car", slotType: "Standard", ratePerHour: "" });
  const [rateEdits, setRateEdits] = useState({});
  const [error, setError] = useState("");

  async function load() {
    try {
      const [s, r, v] = await Promise.all([api("/api/slots"), api("/api/rates"), api("/api/reports/revenue")]);
      setSlots(s);
      setRates(r);
      setRev(v);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function run(fn) {
    setError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const addSlot = (e) => {
    e.preventDefault();
    run(async () => {
      await api("/api/slots", { method: "POST", body: slotForm });
      setSlotForm({ slotNumber: "", slotType: "Standard" });
    });
  };

  const saveRate = (e) => {
    e.preventDefault();
    run(async () => {
      await api("/api/rates", {
        method: "POST",
        body: { ...rateForm, ratePerHour: Number(rateForm.ratePerHour) },
      });
      setRateForm({ ...rateForm, ratePerHour: "" });
    });
  };

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Revenue report</h2>
        {rev && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Total collected", `₹${rev.totalPaid}`],
                ["Today", `₹${rev.todayPaid}`],
                ["Pending", `₹${rev.totalPending}`],
                ["Payments", rev.paymentCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="text-xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ReportTable title="Last 30 days" keyName="Day" rows={rev.byDay} />
              <ReportTable title="By method" keyName="Payment_Method" rows={rev.byMethod} />
              <ReportTable title="By vehicle type" keyName="Vehicle_Type" rows={rev.byVehicleType} />
            </div>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Slots</h2>
        <form onSubmit={addSlot} className="flex flex-wrap gap-2">
          <input className={input} required placeholder="Slot number (e.g. C1)" value={slotForm.slotNumber} onChange={(e) => setSlotForm({ ...slotForm, slotNumber: e.target.value })} />
          <select className={input} value={slotForm.slotType} onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value })}>
            {SLOT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <button className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500">Add slot</button>
        </form>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr><th className={th}>Slot</th><th className={th}>Type</th><th className={th}>Status</th><th className={th}>Actions</th></tr>
            </thead>
            <tbody>
              {slots.map((s) => (
                <tr key={s.Slot_ID} className="border-t border-slate-700 bg-slate-900">
                  <td className={td}>{s.Slot_Number}</td>
                  <td className={td}>
                    <select
                      className="rounded border border-slate-600 bg-slate-800 p-1"
                      value={s.Slot_Type}
                      disabled={s.Status === "Occupied"}
                      onChange={(e) => run(() => api(`/api/slots/${s.Slot_ID}`, { method: "PUT", body: { slotType: e.target.value } }))}
                    >
                      {SLOT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className={td}>{s.Status}</td>
                  <td className={`${td} space-x-2`}>
                    {s.Status !== "Occupied" && (
                      <>
                        <button
                          className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600"
                          onClick={() => run(() => api(`/api/slots/${s.Slot_ID}`, { method: "PUT", body: { status: s.Status === "Available" ? "Reserved" : "Available" } }))}
                        >
                          {s.Status === "Available" ? "Block" : "Unblock"}
                        </button>
                        <button
                          className="rounded bg-red-700 px-3 py-1 hover:bg-red-600"
                          onClick={() => confirm(`Delete slot ${s.Slot_Number}?`) && run(() => api(`/api/slots/${s.Slot_ID}`, { method: "DELETE" }))}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Rates</h2>
        <form onSubmit={saveRate} className="flex flex-wrap gap-2">
          <select className={input} value={rateForm.vehicleType} onChange={(e) => setRateForm({ ...rateForm, vehicleType: e.target.value })}>
            {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className={input} value={rateForm.slotType} onChange={(e) => setRateForm({ ...rateForm, slotType: e.target.value })}>
            {SLOT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className={input} required type="number" min="1" step="0.01" placeholder="₹ per hour" value={rateForm.ratePerHour} onChange={(e) => setRateForm({ ...rateForm, ratePerHour: e.target.value })} />
          <button className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500">Add / update rate</button>
        </form>
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr><th className={th}>Vehicle</th><th className={th}>Slot type</th><th className={th}>₹ / hour</th><th className={th}>Actions</th></tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.Rate_ID} className="border-t border-slate-700 bg-slate-900">
                  <td className={td}>{r.Vehicle_Type}</td>
                  <td className={td}>{r.Slot_Type}</td>
                  <td className={td}>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      className="w-28 rounded border border-slate-600 bg-slate-800 p-1"
                      value={rateEdits[r.Rate_ID] ?? r.Rate_Per_Hour}
                      onChange={(e) => setRateEdits({ ...rateEdits, [r.Rate_ID]: e.target.value })}
                    />
                  </td>
                  <td className={`${td} space-x-2`}>
                    <button
                      className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600"
                      onClick={() => run(() => api(`/api/rates/${r.Rate_ID}`, { method: "PUT", body: { ratePerHour: Number(rateEdits[r.Rate_ID] ?? r.Rate_Per_Hour) } }))}
                    >
                      Save
                    </button>
                    <button
                      className="rounded bg-red-700 px-3 py-1 hover:bg-red-600"
                      onClick={() => confirm("Delete this rate?") && run(() => api(`/api/rates/${r.Rate_ID}`, { method: "DELETE" }))}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function ReportTable({ title, keyName, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-800 text-slate-300">
          <tr><th className="p-2" colSpan={2}>{title}</th></tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td className="p-2 text-slate-400" colSpan={2}>No data</td></tr>
          )}
          {rows.map((r) => (
            <tr key={r[keyName]} className="border-t border-slate-700 bg-slate-900">
              <td className="p-2">{r[keyName]}</td>
              <td className="p-2 text-right">₹{r.Revenue}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
