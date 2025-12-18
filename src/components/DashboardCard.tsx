import React from "react";

export default function DashboardCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
      {title && <div className="text-sm text-gray-500 mb-2">{title}</div>}
      <div>{children}</div>
    </div>
  );
}
