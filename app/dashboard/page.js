"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const slotColor = {
  Available: "border-emerald-600 text-emerald-400",
  Occupied: "border-red-600 text-red-400",
  Reserved: "border-amber-500 text-amber-400",
};

export default function DashboardPage() {
  const [occ, setOcc] = useState(null);
  const [rev, setRev] = useState(null);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/api/reports/occupancy"), api("/api/reports/revenue"), api("/api/slots")])
      .then(([o, r, s]) => {
        setOcc(o);
        setRev(r);
        setSlots(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  const cards = occ && rev
    ? [
        ["Total slots", occ.total],
        ["Available", occ.available],
        ["Occupied", occ.occupied],
        ["Reserved", occ.reserved],
        ["Occupancy", `${occ.occupancyPercent}%`],
        ["Active reservations", occ.activeReservations],
        ["Today's revenue", `₹${rev.todayPaid}`],
        ["Pending dues", `₹${rev.totalPending}`],
      ]
    : [];

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold">Slots</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {slots.map((s) => (
          <div key={s.Slot_ID} className={`rounded-lg border bg-slate-900 p-3 text-center ${slotColor[s.Status]}`}>
            <p className="text-lg font-semibold">{s.Slot_Number}</p>
            <p className="text-xs">{s.Slot_Type}</p>
            <p className="text-xs">{s.Status}</p>
          </div>
        ))}
      </div>

      {occ && (
        <div className="overflow-x-auto rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="p-3">Slot type</th>
                <th className="p-3">Total</th>
                <th className="p-3">Available</th>
                <th className="p-3">Occupied</th>
                <th className="p-3">Reserved</th>
              </tr>
            </thead>
            <tbody>
              {occ.bySlotType.map((r) => (
                <tr key={r.Slot_Type} className="border-t border-slate-700 bg-slate-900">
                  <td className="p-3">{r.Slot_Type}</td>
                  <td className="p-3">{r.Total}</td>
                  <td className="p-3">{r.Available}</td>
                  <td className="p-3">{r.Occupied}</td>
                  <td className="p-3">{r.Reserved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
