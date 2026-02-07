import React from 'react';

interface BudgetCardProps {
  category: string;
  spent: number;
  limit: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function BudgetCard({ category, spent, limit, remaining, percentage, status, onEdit, onDelete }: BudgetCardProps) {
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case 'exceeded': return 'text-error-600 bg-error-50 dark:bg-error-900/20';
      case 'warning': return 'text-warning-600 bg-warning-50 dark:bg-warning-900/20';
      default: return 'text-success-600 bg-success-50 dark:bg-success-900/20';
    }
  };

  const getProgressColor = (p: number) => {
    if (p >= 100) return 'bg-error-500';
    if (p >= 80) return 'bg-warning-500';
    return 'bg-success-500';
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'exceeded': return 'Melebihi';
      case 'warning': return 'Hampir';
      default: return 'Aman';
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">{category}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(spent)} dari {formatCurrency(limit)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`badge ${getStatusColor(status)}`}>
            {getStatusLabel(status)}
          </span>
          {onEdit && (
            <button onClick={onEdit} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Edit
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="text-error-600 hover:text-error-700 text-sm font-medium">
              Hapus
            </button>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressColor(percentage)}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium">{percentage}% terpakai</span>
        <span>Sisa: {formatCurrency(Math.max(0, remaining))}</span>
      </div>
    </div>
  );
}
