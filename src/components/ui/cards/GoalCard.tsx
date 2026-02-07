import React from 'react';

interface GoalCardProps {
  name: string;
  currentAmount: number;
  targetAmount: number;
  progress: number;
  daysRemaining: number | null;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'abandoned';
  contributionsCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
  onContribute?: () => void;
}

export default function GoalCard({ 
  name, 
  currentAmount, 
  targetAmount, 
  progress, 
  daysRemaining, 
  priority, 
  status,
  contributionsCount,
  onEdit, 
  onDelete,
  onContribute 
}: GoalCardProps) {
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
  
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'high': return 'text-error-600 bg-error-50 dark:bg-error-900/20';
      case 'medium': return 'text-warning-600 bg-warning-50 dark:bg-warning-900/20';
      default: return 'text-primary-600 bg-primary-50 dark:bg-primary-900/20';
    }
  };

  const getPriorityLabel = (p: string) => {
    switch (p) {
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      default: return 'Rendah';
    }
  };

  const getProgressColor = (p: number) => {
    if (p >= 100) return 'bg-success-500';
    if (p >= 50) return 'bg-primary-500';
    return 'bg-gray-400';
  };

  return (
    <div className={`card ${status === 'completed' ? 'border-success-500 border-2' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-dark-text-primary">{name}</h3>
            {status === 'completed' && (
              <span className="text-success-500 text-xl">✓</span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(currentAmount)} dari {formatCurrency(targetAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`badge ${getPriorityColor(priority)}`}>
            {getPriorityLabel(priority)}
          </span>
          {status === 'active' && onContribute && (
            <button 
              onClick={onContribute}
              className="px-3 py-1 bg-success-600 text-white rounded-xl text-sm font-medium hover:bg-success-700 transition-colors"
            >
              + Tambah
            </button>
          )}
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
      <div className="relative mb-2">
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressColor(progress)}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="font-medium">{progress}% tercapai</span>
        <div className="flex gap-3">
          {daysRemaining !== null && (
            <span>{daysRemaining > 0 ? `${daysRemaining} hari lagi` : 'Deadline lewat'}</span>
          )}
          <span>{contributionsCount} kontribusi</span>
        </div>
      </div>
      
      {/* Remaining amount */}
      {status === 'active' && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          Sisa yang dibutuhkan: <span className="font-semibold text-gray-900 dark:text-dark-text-primary">{formatCurrency(Math.max(0, targetAmount - currentAmount))}</span>
        </div>
      )}
    </div>
  );
}
