"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function MonthlyReportPage() {
  return (
    <ProtectedRoute>
      <div className="p-6 max-w-4xl mx-auto dark:text-white">
        <h1 className="text-2xl font-bold mb-4">Laporan Bulanan</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
          <p className="text-gray-500">Ringkasan bulanan akan ditampilkan di sini (placeholder).</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
