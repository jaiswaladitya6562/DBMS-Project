"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const CATEGORIES = ["Billing", "Slot", "Staff", "Safety", "Other"];
const input = "w-full rounded border border-slate-600 bg-slate-800 p-2";

export default function FeedbackPage() {
  const [fb, setFb] = useState({ rating: "5", message: "" });
  const [cp, setCp] = useState({ category: "Other", priority: "Medium", message: "" });
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api("/api/notifications").then(setNotes).catch((e) => setError(e.message));
  }, []);

  async function send(url, body, reset, okText) {
    setError("");
    setMessage("");
    try {
      await api(url, { method: "POST", body });
      reset();
      setMessage(okText);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Feedback & Complaints</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}
      {message && <p className="rounded bg-emerald-950 border border-emerald-800 p-3 text-emerald-300">{message}</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Notifications</h2>
        {notes.length === 0 && <p className="text-slate-400">No notifications.</p>}
        {notes.map((n) => (
          <div key={n._id} className="rounded-lg border border-slate-700 bg-slate-900 p-3">
            <p>{n.message}</p>
            <p className="text-xs text-slate-400">
              {n.priority} · {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      <form
        className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send("/api/feedback", { rating: Number(fb.rating), message: fb.message }, () => setFb({ rating: "5", message: "" }), "Thanks for your feedback");
        }}
      >
        <h2 className="text-lg font-semibold">Give feedback</h2>
        <select className={input} value={fb.rating} onChange={(e) => setFb({ ...fb, rating: e.target.value })}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>{n} / 5</option>
          ))}
        </select>
        <textarea className={input} required rows={3} maxLength={1000} placeholder="Your feedback" value={fb.message} onChange={(e) => setFb({ ...fb, message: e.target.value })} />
        <button className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500">Submit feedback</button>
      </form>

      <form
        className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send("/api/complaints", cp, () => setCp({ category: "Other", priority: "Medium", message: "" }), "Complaint registered");
        }}
      >
        <h2 className="text-lg font-semibold">Raise a complaint</h2>
        <div className="grid grid-cols-2 gap-2">
          <select className={input} value={cp.category} onChange={(e) => setCp({ ...cp, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className={input} value={cp.priority} onChange={(e) => setCp({ ...cp, priority: e.target.value })}>
            {["Low", "Medium", "High"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <textarea className={input} required minLength={5} rows={3} maxLength={1000} placeholder="Describe the problem" value={cp.message} onChange={(e) => setCp({ ...cp, message: e.target.value })} />
        <button className="rounded bg-red-700 px-4 py-2 font-medium hover:bg-red-600">Submit complaint</button>
      </form>
    </main>
  );
}
