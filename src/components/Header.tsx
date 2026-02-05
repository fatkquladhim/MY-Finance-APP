"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/finances', label: 'Keuangan', icon: '💳' },
    { href: '/budgets', label: 'Budget', icon: '📋' },
    { href: '/goals', label: 'Goals', icon: '🎯' },
    { href: '/portfolio', label: 'Portofolio', icon: '💼' },
    { href: '/report/monthly', label: 'Laporan', icon: '📈' },
  ];

  return (
    <header className="bg-blue-600 text-white dark:bg-blue-800 shadow-md">
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-4 py-3">
        <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="hidden sm:inline">FinanceApp</span>
        </Link>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-3">
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded hover:bg-blue-500 transition-colors"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button 
            aria-label="Open menu" 
            onClick={() => setOpen((s) => !s)} 
            className="p-2 hover:bg-blue-500 rounded transition-colors"
          >
            {open ? "✖️" : "☰"}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1">
          {session ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-700 dark:bg-blue-900'
                      : 'hover:bg-blue-500 dark:hover:bg-blue-700'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <div className="h-6 w-px bg-blue-400 mx-2" />
              <Link
                href="/profile"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/profile')
                    ? 'bg-blue-700 dark:bg-blue-900'
                    : 'hover:bg-blue-500 dark:hover:bg-blue-700'
                }`}
              >
                👤 Profil
              </Link>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>
              <button 
                onClick={() => signOut()} 
                className="px-3 py-2 rounded-lg text-red-200 hover:bg-red-500/20 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              href="/login"
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile navigation */}
      {open && (
        <div className="md:hidden border-t border-blue-500 bg-blue-700/95 dark:bg-blue-900/95 backdrop-blur-sm">
          {session ? (
            <div className="p-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive(link.href)
                      ? 'bg-blue-600 dark:bg-blue-800'
                      : 'hover:bg-blue-600/50'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-blue-500 my-2" />
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/profile')
                    ? 'bg-blue-600 dark:bg-blue-800'
                    : 'hover:bg-blue-600/50'
                }`}
              >
                👤 Profil
              </Link>
              <button 
                onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); setOpen(false); }} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-600/50 transition-colors w-full text-left"
              >
                {theme === "dark" ? "☀️ Mode Terang" : "🌙 Mode Gelap"}
              </button>
              <button 
                onClick={() => signOut()} 
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-200 hover:bg-red-500/20 transition-colors w-full text-left"
              >
                🚪 Logout
              </button>
            </div>
          ) : (
            <div className="p-3">
              <Link 
                href="/login" 
                onClick={() => setOpen(false)}
                className="block px-4 py-2 bg-white text-blue-600 rounded-lg font-medium text-center"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
