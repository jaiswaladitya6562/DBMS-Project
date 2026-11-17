"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function HistoryPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState("");
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role === "admin") {
          setIsAdmin(true);
          api("/api/vehicles").then(setVehicles).catch((e) => setError(e.message));
        }
      });
  }, []);

  useEffect(() => {
    const url = vehicleId ? `/api/history?vehicleId=${vehicleId}` : "/api/history";
    api(url).then(setRows).catch((e) => setError(e.message));
  }, [vehicleId]);

  const total = rows.reduce((sum, r) => sum + Number(r.Amount || 0), 0);

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Parking History</h1>
        {isAdmin && (
          <select
            className="rounded border border-slate-600 bg-slate-800 p-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">All vehicles</option>
            {vehicles.map((v) => (
              <option key={v.Vehicle_ID} value={v.Vehicle_ID}>
                {v.Vehicle_Number}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <p className="text-slate-300">
        {rows.length} completed stays · Total ₹{total}
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3">Receipt</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Slot</th>
              <th className="p-3">Entry</th>
              <th className="p-3">Exit</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-slate-400" colSpan={8}>No completed stays.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.Receipt_ID} className="border-t border-slate-700 bg-slate-900">
                <td className="p-3">#{r.Receipt_ID}</td>
                <td className="p-3">
                  {r.Vehicle_Number} ({r.Vehicle_Type})
                </td>
                <td className="p-3">
                  {r.Slot_Number} ({r.Slot_Type})
                </td>
                <td className="p-3">{r.Entry_Time}</td>
                <td className="p-3">{r.Exit_Time}</td>
                <td className="p-3">{r.Duration} min</td>
                <td className="p-3">₹{r.Amount}</td>
                <td className="p-3">
                  {r.Payment_Status ? `${r.Payment_Method} · ${r.Payment_Status}` : "None"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
