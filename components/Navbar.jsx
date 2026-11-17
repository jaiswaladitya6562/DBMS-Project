"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", role: "admin" },
  { href: "/vehicles", label: "Vehicles", adminLabel: "Vehicles", customerLabel: "My Vehicles" },
  { href: "/parking", label: "Parking" },
  { href: "/parking/exit", label: "Exit", role: "admin" },
  { href: "/reservations", label: "Reservations" },
  { href: "/payments", label: "Payments", role: "admin" },
  { href: "/history", label: "History" },
  { href: "/feedback", label: "Feedback", role: "customer" },
  { href: "/admin", label: "Admin", role: "admin" },
  { href: "/admin/inbox", label: "Inbox", role: "admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  if (pathname === "/login" || pathname === "/register") return null;

  const links = LINKS.filter((l) => !l.role || l.role === user?.role);

  return (
    <nav className="border-b border-slate-700 bg-slate-900">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 p-3">
        <Link href="/" className="font-semibold text-emerald-400">
          ParkEase
        </Link>
        {user &&
          links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm hover:text-emerald-400 ${pathname === l.href ? "text-emerald-400" : "text-slate-300"}`}
            >
              {user.role === "customer" && l.customerLabel ? l.customerLabel : l.label}
            </Link>
          ))}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-slate-400">
                {user.name} ({user.role})
              </span>
              <button onClick={logout} className="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded bg-emerald-600 px-3 py-1 hover:bg-emerald-500">
                Login
              </Link>
              <Link href="/register" className="text-slate-300 hover:text-emerald-400">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
