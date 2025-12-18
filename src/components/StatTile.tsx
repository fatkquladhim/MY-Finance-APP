import React from "react";

export default function StatTile({ title, value, delta }: { title: string; value: string; delta?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm flex flex-col justify-between">
      <div className="text-sm text-gray-500 dark:text-gray-400">{title}</div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-2xl font-bold">{value}</div>
        {delta && <div className="text-sm text-green-500">{delta}</div>}
      </div>
    </div>
  );
}
