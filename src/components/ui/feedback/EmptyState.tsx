import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-dark-text-primary">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn btn-primary"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function EmptyTransactions({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="💳"
      title="No transactions yet"
      description="Start tracking your finances by adding your first transaction"
      action={onAdd ? { label: 'Add Transaction', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyBudgets({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="📊"
      title="No budgets set"
      description="Create a budget to start tracking your spending"
      action={onAdd ? { label: 'Create Budget', onClick: onAdd } : undefined}
    />
  );
}

export function EmptyGoals({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon="🎯"
      title="No saving goals"
      description="Set a goal to start saving for what matters"
      action={onAdd ? { label: 'Create Goal', onClick: onAdd } : undefined}
    />
  );
}
