import React from 'react';

interface TransactionCardProps {
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  description?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TransactionCard({ category, amount, type, date, description, onEdit, onDelete }: TransactionCardProps) {
  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
  
  const getCategoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      'Makanan & Minuman': '🍔',
      'Transportasi': '🚗',
      'Belanja': '🛒',
      'Hiburan': '🎬',
      'Kesehatan': '🏥',
      'Pendidikan': '📚',
      'Tagihan & Utilitas': '💡',
      'Gaji': '💰',
      'Bonus': '🎁',
      'Investasi': '📈',
    };
    return icons[cat] || '💳';
  };

  return (
    <div className="card h-18 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl .shrink-0">
        {getCategoryIcon(category)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-dark-text-primary truncate">{category}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{date}</div>
      </div>
      <div className={`text-lg font-bold ${type === 'income' ? 'text-success-600' : 'text-error-600'} shrink-0`}>
        {type === 'income' ? '+' : '-'} {formatCurrency(amount)}
      </div>
    </div>
  );
}
