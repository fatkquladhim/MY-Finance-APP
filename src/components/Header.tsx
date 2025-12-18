"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";

export default function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-blue-600 text-white p-4 dark:bg-blue-800">
      <nav className="flex justify-between items-center max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-xl font-bold">💰 FinanceApp</Link>

        <div className="md:hidden flex items-center gap-3">
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded hover:bg-blue-500"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button aria-label="Open menu" onClick={() => setOpen((s) => !s)} className="p-2">
            {open ? "✖️" : "☰"}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <>
              <Link href="/profile" className="hover:underline">Profil</Link>
              <Link href="/finances" className="hover:underline">Keuangan</Link>
              <Link href="/portfolio" className="hover:underline">Portofolio</Link>
              <Link href="/report/monthly" className="hover:underline">Laporan</Link>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded hover:bg-blue-500"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button onClick={() => signOut()} className="text-red-200 hover:underline">Logout</button>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </div>
      </nav>

      {open && (
        <div className="md:hidden mt-2 bg-blue-700/90 p-3">
          {session ? (
            <div className="flex flex-col gap-2">
              <Link href="/profile" onClick={() => setOpen(false)}>Profil</Link>
              <Link href="/finances" onClick={() => setOpen(false)}>Keuangan</Link>
              <Link href="/portfolio" onClick={() => setOpen(false)}>Portofolio</Link>
              <Link href="/report/monthly" onClick={() => setOpen(false)}>Laporan</Link>
              <button onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); }} className="text-left">{theme === "dark" ? "☀️ Light" : "🌙 Dark"}</button>
              <button onClick={() => signOut()} className="text-left text-red-200">Logout</button>
            </div>
          ) : (
            <Link href="/login" onClick={() => setOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </header>
  );
}