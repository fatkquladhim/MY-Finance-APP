"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Target,
  User
} from "lucide-react";

export default function BottomNavbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [ 
    { href: '/finances', icon: CreditCard, label: 'Transactions' },
    { href: '/budgets', icon: Wallet, label: 'Budget' },
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-bg-secondary shadow-large rounded-t-3xl z-50 border-t border-gray-100 dark:border-gray-700 hide-desktop">
       <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-white dark:bg-dark-bg-secondary rounded-b-full z-10"></div>

      <div className="relative flex justify-around items-center h-16 bg-white dark:bg-dark-bg-secondary rounded-t-3xl shadow-large border-t border-gray-100 dark:border-gray-700">
        {navItems.map((item) => (
         <Link
        key={item.href}
        href={item.href}
        className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ease-out
            ${
            isActive(item.href)
                ? "text-primary-600 dark:text-primary-400"
                : "text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            }
        `}
        >
        {/* Bubble */}
        <span
            className={`absolute inset-0 rounded-full transition-all duration-300
            ${
                isActive(item.href)
                ? "bg-primary-100 dark:bg-primary-900/30 scale-100"
                : "bg-primary-100/0 scale-0 hover:scale-100 hover:bg-primary-100 dark:hover:bg-primary-900/30"
            }
            `}
        />

        {/* Icon */}
        <item.icon className="relative z-10 w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1" />
        </Link>

        ))}
      </div>
    </nav>
  );
}
