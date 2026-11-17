"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [methods, setMethods] = useState({});
  const [error, setError] = useState("");

  async function load() {
    try {
      setPayments(await api("/api/payments"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function pay(receiptId) {
    setError("");
    try {
      await api("/api/payments", {
        method: "POST",
        body: { receiptId, paymentMethod: methods[receiptId] || "Cash" },
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Payments</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3">Payment</th>
              <th className="p-3">Receipt</th>
              <th className="p-3">Vehicle</th>
              <th className="p-3">Slot</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td className="p-3 text-slate-400" colSpan={8}>No payments yet.</td>
              </tr>
            )}
            {payments.map((p) => (
              <tr key={p.Payment_ID} className="border-t border-slate-700 bg-slate-900">
                <td className="p-3">#{p.Payment_ID}</td>
                <td className="p-3">#{p.Receipt_ID}</td>
                <td className="p-3">{p.Vehicle_Number}</td>
                <td className="p-3">{p.Slot_Number}</td>
                <td className="p-3">₹{p.Amount}</td>
                <td className="p-3">
                  {p.Payment_Status === "Paid" ? (
                    p.Payment_Method
                  ) : (
                    <select
                      className="rounded border border-slate-600 bg-slate-800 p-1"
                      value={methods[p.Receipt_ID] || "Cash"}
                      onChange={(e) => setMethods({ ...methods, [p.Receipt_ID]: e.target.value })}
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                    </select>
                  )}
                </td>
                <td className="p-3">
                  {p.Payment_Status === "Paid" ? (
                    <span className="text-emerald-400">Paid</span>
                  ) : (
                    <button
                      onClick={() => pay(p.Receipt_ID)}
                      className="rounded bg-emerald-600 px-3 py-1 hover:bg-emerald-500"
                    >
                      Pay now ({p.Payment_Status})
                    </button>
                  )}
                </td>
                <td className="p-3">{p.Payment_Date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
