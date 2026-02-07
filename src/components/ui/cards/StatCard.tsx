import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
  deltaPositive?: boolean;
}

export default function StatCard({ title, value, delta, icon, deltaPositive = true }: StatCardProps) {
  return (
    <div className="card h-30 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{title}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
          {icon}
        </div>
      </div>
      {delta && (
        <div className={`text-sm font-medium ${deltaPositive ? 'text-success-600' : 'text-error-600'}`}>
          {deltaPositive ? '↑' : '↓'} {delta}
        </div>
      )}
    </div>
  );
}
