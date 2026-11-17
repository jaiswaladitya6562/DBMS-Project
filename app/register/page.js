"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

const input = "w-full rounded border border-slate-600 bg-slate-800 p-2";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth/register", {
        method: "POST",
        body: { name: form.name, phone: form.phone, email: form.email, password: form.password },
      });
      window.location.href = "/vehicles";
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      {error && <p className="rounded bg-red-950 border border-red-800 p-3 text-red-300">{error}</p>}

      <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-700 bg-slate-900 p-4">
        <input className={input} required minLength={2} maxLength={100} placeholder="Full name" value={form.name} onChange={set("name")} />
        <input className={input} required inputMode="numeric" maxLength={10} placeholder="Phone number (10 digits)" value={form.phone} onChange={set("phone")} />
        <input className={input} type="email" maxLength={100} placeholder="Email (optional)" value={form.email} onChange={set("email")} />
        <input className={input} required type="password" minLength={8} maxLength={128} placeholder="Password (at least 8 characters)" value={form.password} onChange={set("password")} />
        <input className={input} required type="password" placeholder="Confirm password" value={form.confirm} onChange={set("confirm")} />
        <button disabled={busy} className="w-full rounded bg-emerald-600 p-2 font-medium hover:bg-emerald-500 disabled:opacity-50">
          {busy ? "Creating..." : "Create account"}
        </button>
      </form>

      <p className="text-sm text-slate-400">
        Already registered?{" "}
        <Link href="/login" className="text-emerald-400 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
