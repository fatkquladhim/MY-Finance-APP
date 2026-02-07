"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
export default function TopNavbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/finances", label: "Transactions" },
    { href: "/budgets", label: "Budget" },
    { href: "/goals", label: "Goals" },
    { href: "/portfolio", label: "Portfolio" },
  ];

  return (
    <header className="bg-white dark:bg-dark-bg-secondary shadow-soft sticky top-0 z-50 border-b border-gray-100 dark:border-gray-700">
      <nav className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 py-4">
        
        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-xl font-bold text-gray-900 dark:text-dark-text-primary hover:text-primary-600 transition-colors"
        >
          <span className="hidden sm:inline">FinanceApp</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {session ? (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2" />

              <Link
                href="/profile"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive("/profile")
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                👤 Profile
              </Link>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? "☀️" : "🌙"}
              </button>

              <button
                onClick={() => signOut()}
                className="px-4 py-2 rounded-xl text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors text-sm font-medium"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Actions ONLY */}
       <div className="md:hidden flex items-center justify-between w-full">
  
        {/* LEFT: Logo */}
        <Link
            href="/dashboard"
            className="text-lg font-bold text-gray-900 dark:text-dark-text-primary hover:text-primary-600 transition-colors"
        >
            FinanceApp
        </Link>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-3">
            <button
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
            >
            {theme === "dark" ? "☀️" : "🌙"}
            </button>

            {session && (
            <button
                onClick={() => signOut()}
                aria-label="Logout"
                className="p-2 rounded-xl text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
            >
                <LogOut className="w-5 h-5" />
            </button>
            )}
        </div>
        </div>
      </nav>
    </header>
  );
}
