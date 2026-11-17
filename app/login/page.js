"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

const input = "w-full rounded border border-slate-600 bg-slate-800 p-2";

export default function LoginPage() {
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const body =
        role === "admin"
          ? { role, password: form.password }
          : { role, phone: form.phone, password: form.password };
      await api("/api/auth/login", { method: "POST", body });

      const next = new URLSearchParams(window.location.search).get("next");
      const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      window.location.href = role === "admin" && safe === "/" ? "/dashboard" : safe;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function pick(r) {
    setRole(r);
    setError("");
    setForm({ phone: "", password: "" });
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Login</h1>

      <div className="grid grid-cols-2 gap-2">
        {["customer", "admin"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => pick(r)}
            className={`rounded p-2 ${role === r ? "bg-emerald-600" : "bg-slate-800 hover:bg-slate-700"}`}
          >
            {r === "customer" ? "Vehicle owner" : "Admin"}
          </button>
        ))}
      </div>

      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4">
        {role === "customer" && (
          <input
            className={input}
            required
            inputMode="numeric"
            maxLength={10}
            placeholder="Phone number (10 digits)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        )}
        <input
          className={input}
          required
          type="password"
          placeholder={role === "admin" ? "Admin password" : "Password"}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button disabled={busy} className="w-full rounded bg-emerald-600 p-2 font-medium hover:bg-emerald-500 disabled:opacity-50">
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {role === "customer" && (
        <p className="text-sm text-slate-400">
          New here?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">
            Create an account
          </Link>
        </p>
      )}
    </main>
  );
}
