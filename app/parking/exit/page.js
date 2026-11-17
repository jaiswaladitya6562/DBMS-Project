"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function ExitPage() {
  const [parked, setParked] = useState([]);
  const [methods, setMethods] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setParked(await api("/api/parking"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function exit(receiptId) {
    setError("");
    setBusyId(receiptId);
    try {
      const data = await api(`/api/parking/${receiptId}`, {
        method: "PUT",
        body: { paymentMethod: methods[receiptId] || "Cash" },
      });
      setResult(data);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Vehicle Exit</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      {result && (
        <div className="rounded-lg border border-emerald-700 bg-slate-900 p-4 space-y-1">
          <h2 className="font-semibold text-emerald-400">Exit complete: Receipt #{result.Receipt_ID}</h2>
          <p>Vehicle: {result.Vehicle_Number} | Slot: {result.Slot_Number}</p>
          <p>Entry: {result.Entry_Time}</p>
          <p>Exit: {result.Exit_Time}</p>
          <p>Duration: {result.Duration} min | Rate: ₹{result.Rate_Per_Hour}/hr</p>
          <p className="text-lg font-semibold">Amount: ₹{result.Amount}</p>
          <p>
            Payment: {result.Payment?.Payment_Method} ({result.Payment?.Payment_Status})
          </p>
        </div>
      )}

      <div className="space-y-3">
        {parked.length === 0 && <p className="text-slate-400">No vehicles currently parked.</p>}
        {parked.map((r) => (
          <div
            key={r.Receipt_ID}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900 p-4"
          >
            <div>
              <p className="font-medium">
                #{r.Receipt_ID} · {r.Vehicle_Number} ({r.Vehicle_Type})
              </p>
              <p className="text-sm text-slate-400">
                Slot {r.Slot_Number} · Entered {r.Entry_Time} · ₹{r.Rate_Per_Hour}/hr
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="rounded border border-slate-600 bg-slate-800 p-2"
                value={methods[r.Receipt_ID] || "Cash"}
                onChange={(e) => setMethods({ ...methods, [r.Receipt_ID]: e.target.value })}
              >
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
              </select>
              <button
                onClick={() => exit(r.Receipt_ID)}
                disabled={busyId === r.Receipt_ID}
                className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
              >
                {busyId === r.Receipt_ID ? "Processing..." : "Exit & Pay"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
