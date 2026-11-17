"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const TYPES = ["Bike", "Car", "SUV", "Truck"];
const input = "rounded border border-slate-600 bg-slate-800 p-2";
const empty = { vehicleNumber: "", vehicleType: "Car", model: "" };

export default function VehiclesPage() {
  const [role, setRole] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState(empty);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      setRows(await api("/api/vehicles"));
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

  async function run(fn, doneText) {
    setError("");
    setMessage("");
    try {
      await fn();
      if (doneText) setMessage(doneText);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  const add = (e) => {
    e.preventDefault();
    run(async () => {
      await api("/api/vehicles", { method: "POST", body: form });
      setForm(empty);
    }, "Vehicle added");
  };

  const startEdit = (v) => {
    setEditId(v.Vehicle_ID);
    setEdit({ vehicleNumber: v.Vehicle_Number, vehicleType: v.Vehicle_Type, model: v.Model || "" });
  };

  const saveEdit = () =>
    run(async () => {
      await api(`/api/vehicles/${editId}`, { method: "PUT", body: edit });
      setEditId(null);
    }, "Vehicle updated");

  const remove = (v) =>
    confirm(`Delete ${v.Vehicle_Number}?`) &&
    run(() => api(`/api/vehicles/${v.Vehicle_ID}`, { method: "DELETE" }), "Vehicle deleted");

  const isAdmin = role === "admin";
  const q = search.trim().toUpperCase();
  const shown = isAdmin && q
    ? rows.filter((v) => `${v.Vehicle_Number} ${v.Owner_Name} ${v.Phone}`.toUpperCase().includes(q))
    : rows;

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{isAdmin ? "Registered Vehicles" : "My Vehicles"}</h1>
        {isAdmin && (
          <input
            className={input}
            placeholder="Search number, owner or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        )}
      </div>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}
      {message && <p className="rounded bg-emerald-950 border border-emerald-800 p-3 text-emerald-300">{message}</p>}

      {role === "customer" && (
        <form onSubmit={add} className="flex flex-wrap gap-2 rounded-lg border border-slate-700 bg-slate-900 p-4">
          <input className={input} required placeholder="Vehicle number" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
          <select className={input} value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className={input} maxLength={50} placeholder="Model (optional)" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <button className="rounded bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500">Add vehicle</button>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="p-3">Number</th>
              <th className="p-3">Type</th>
              <th className="p-3">Model</th>
              {isAdmin && <th className="p-3">Owner</th>}
              {isAdmin && <th className="p-3">Phone</th>}
              {role === "customer" && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td className="p-3 text-slate-400" colSpan={6}>
                  {role === "customer" ? "No vehicles yet. Add your first one above." : "No vehicles found."}
                </td>
              </tr>
            )}
            {shown.map((v) =>
              editId === v.Vehicle_ID ? (
                <tr key={v.Vehicle_ID} className="border-t border-slate-700 bg-slate-900">
                  <td className="p-2"><input className={`${input} w-full`} value={edit.vehicleNumber} onChange={(e) => setEdit({ ...edit, vehicleNumber: e.target.value })} /></td>
                  <td className="p-2">
                    <select className={input} value={edit.vehicleType} onChange={(e) => setEdit({ ...edit, vehicleType: e.target.value })}>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input className={`${input} w-full`} maxLength={50} value={edit.model} onChange={(e) => setEdit({ ...edit, model: e.target.value })} /></td>
                  <td className="p-2 space-x-2">
                    <button onClick={saveEdit} className="rounded bg-emerald-600 px-3 py-1 hover:bg-emerald-500">Save</button>
                    <button onClick={() => setEditId(null)} className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={v.Vehicle_ID} className="border-t border-slate-700 bg-slate-900">
                  <td className="p-3 font-medium">{v.Vehicle_Number}</td>
                  <td className="p-3">{v.Vehicle_Type}</td>
                  <td className="p-3">{v.Model || "-"}</td>
                  {isAdmin && <td className="p-3">{v.Owner_Name}</td>}
                  {isAdmin && <td className="p-3">{v.Phone}</td>}
                  {role === "customer" && (
                    <td className="p-3 space-x-2">
                      <button onClick={() => startEdit(v)} className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600">Edit</button>
                      <button onClick={() => remove(v)} className="rounded bg-red-700 px-3 py-1 hover:bg-red-600">Delete</button>
                    </td>
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
