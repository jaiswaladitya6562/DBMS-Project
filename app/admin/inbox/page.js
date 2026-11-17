"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const TABS = ["Complaints", "Feedback", "Incidents", "Notifications", "Activity"];
const STATUSES = ["Open", "In Progress", "Resolved"];
const INCIDENT_TYPES = ["Damage", "Theft", "Accident", "Overstay", "Other"];
const input = "rounded border border-slate-600 bg-slate-800 p-2";
const when = (d) => new Date(d).toLocaleString();

export default function InboxPage() {
  const [tab, setTab] = useState("Complaints");
  const [data, setData] = useState({ Complaints: [], Feedback: [], Incidents: [], Notifications: [], Activity: [] });
  const [inc, setInc] = useState({ type: "Damage", slotNumber: "", priority: "Medium", message: "" });
  const [note, setNote] = useState({ ownerId: "", priority: "Medium", message: "" });
  const [error, setError] = useState("");

  async function load() {
    try {
      const [c, f, i, n, a] = await Promise.all([
        api("/api/complaints"),
        api("/api/feedback"),
        api("/api/incidents"),
        api("/api/notifications"),
        api("/api/activity?limit=100"),
      ]);
      setData({ Complaints: c, Feedback: f, Incidents: i, Notifications: n, Activity: a });
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

  const card = "rounded-lg border border-slate-700 bg-slate-900 p-3 space-y-1";

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded px-3 py-1 ${tab === t ? "bg-emerald-600" : "bg-slate-800 hover:bg-slate-700"}`}>
            {t} ({data[t].length})
          </button>
        ))}
      </div>

      {tab === "Complaints" &&
        data.Complaints.map((c) => (
          <div key={c._id} className={card}>
            <p className="font-medium">{c.category} · {c.priority}</p>
            <p>{c.message}</p>
            <p className="text-xs text-slate-400">Owner {c.ownerId ?? "-"} · {when(c.createdAt)}</p>
            <select
              className="rounded border border-slate-600 bg-slate-800 p-1"
              value={c.status}
              onChange={(e) => run(() => api(`/api/complaints/${c._id}`, { method: "PUT", body: { status: e.target.value } }))}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        ))}

      {tab === "Feedback" &&
        data.Feedback.map((f) => (
          <div key={f._id} className={card}>
            <p className="font-medium">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</p>
            <p>{f.message}</p>
            <p className="text-xs text-slate-400">Owner {f.ownerId ?? "-"} · {when(f.createdAt)}</p>
          </div>
        ))}

      {tab === "Incidents" && (
        <>
          <form
            className="grid gap-2 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api("/api/incidents", { method: "POST", body: inc });
                setInc({ type: "Damage", slotNumber: "", priority: "Medium", message: "" });
              });
            }}
          >
            <select className={input} value={inc.type} onChange={(e) => setInc({ ...inc, type: e.target.value })}>
              {INCIDENT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input className={input} placeholder="Slot (optional)" value={inc.slotNumber} onChange={(e) => setInc({ ...inc, slotNumber: e.target.value })} />
            <select className={input} value={inc.priority} onChange={(e) => setInc({ ...inc, priority: e.target.value })}>
              {["Low", "Medium", "High"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <input className={`${input} sm:col-span-3`} required minLength={5} placeholder="What happened?" value={inc.message} onChange={(e) => setInc({ ...inc, message: e.target.value })} />
            <button className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 sm:col-span-3">Log incident</button>
          </form>
          {data.Incidents.map((i) => (
            <div key={i._id} className={card}>
              <p className="font-medium">{i.type} · {i.priority}{i.slotNumber ? ` · Slot ${i.slotNumber}` : ""}</p>
              <p>{i.message}</p>
              <p className="text-xs text-slate-400">{when(i.createdAt)}</p>
            </div>
          ))}
        </>
      )}

      {tab === "Notifications" && (
        <>
          <form
            className="grid gap-2 rounded-lg border border-slate-700 bg-slate-900 p-4 sm:grid-cols-3"
            onSubmit={(e) => {
              e.preventDefault();
              run(async () => {
                await api("/api/notifications", { method: "POST", body: note });
                setNote({ ownerId: "", priority: "Medium", message: "" });
              });
            }}
          >
            <input className={input} placeholder="Owner ID (blank = everyone)" value={note.ownerId} onChange={(e) => setNote({ ...note, ownerId: e.target.value })} />
            <select className={input} value={note.priority} onChange={(e) => setNote({ ...note, priority: e.target.value })}>
              {["Low", "Medium", "High"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <input className={input} required minLength={3} placeholder="Message" value={note.message} onChange={(e) => setNote({ ...note, message: e.target.value })} />
            <button className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 sm:col-span-3">Send notification</button>
          </form>
          {data.Notifications.map((n) => (
            <div key={n._id} className={card}>
              <p>{n.message}</p>
              <p className="text-xs text-slate-400">To {n.ownerId ?? "everyone"} · {n.priority} · {when(n.createdAt)}</p>
            </div>
          ))}
        </>
      )}

      {tab === "Activity" &&
        data.Activity.map((a) => (
          <div key={a._id} className={card}>
            <p className="font-medium">{a.action}</p>
            <p className="text-xs text-slate-400">
              {a.actor?.role ?? "system"}{a.actor?.ownerId ? ` #${a.actor.ownerId}` : ""} · {when(a.createdAt)}
            </p>
            {a.details && Object.keys(a.details).length > 0 && (
              <p className="text-xs text-slate-500">{JSON.stringify(a.details)}</p>
            )}
          </div>
        ))}
    </main>
  );
}
