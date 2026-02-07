"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageContainer from '@/components/layout/PageContainer';
import { useToast } from '@/hooks/useToast';
import BudgetCard from '@/components/ui/cards/BudgetCard';
import { EmptyBudgets } from '@/components/ui/feedback/EmptyState';
import { SkeletonBudget } from '@/components/ui/loading/Skeleton';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import SecondaryButton from '@/components/ui/buttons/SecondaryButton';
import Input from '@/components/ui/forms/Input';
import Select from '@/components/ui/forms/Select';
import Card from '@/components/ui/cards/Card';

interface Budget {
  _id: string;
  category: string;
  monthlyLimit: number;
  period: { month: number; year: number };
  alertThreshold: number;
  isActive: boolean;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export default function BudgetsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [category, setCategory] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  
  // Date state
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const categories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Hiburan',
    'Kesehatan',
    'Pendidikan',
    'Tagihan & Utilitas',
    'Lainnya'
  ];

  useEffect(() => {
    if (session) {
      loadBudgets();
    }
  }, [session, selectedMonth, selectedYear]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Failed to load budgets:', error);
      showToast('Gagal memuat data budget', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCategory('');
    setMonthlyLimit('');
    setAlertThreshold('80');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        category,
        monthlyLimit: parseFloat(monthlyLimit),
        alertThreshold: parseInt(alertThreshold),
        month: selectedMonth,
        year: selectedYear,
        ...(editingId && { id: editingId })
      };

      const res = await fetch('/api/budgets', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingId ? 'Budget diperbarui!' : 'Budget dibuat!', 'success');
        resetForm();
        loadBudgets();
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal menyimpan budget', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget._id);
    setCategory(budget.category);
    setMonthlyLimit(budget.monthlyLimit.toString());
    setAlertThreshold(budget.alertThreshold.toString());
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus budget ini?')) return;
    
    try {
      const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Budget dihapus', 'success');
        loadBudgets();
      } else {
        showToast('Gagal menghapus budget', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <ProtectedRoute>
      <PageContainer>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
              Monthly Budget
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage and track your spending limits
            </p>
          </div>
          <PrimaryButton
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Close' : '+ Add Budget'}
          </PrimaryButton>
        </div>

        {/* Month/Year Selector */}
        <div className="flex gap-3 mb-6">
          <Select
            value={selectedMonth.toString()}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            options={months.map((month, idx) => ({ value: (idx + 1).toString(), label: month }))}
          />
          <Select
            value={selectedYear.toString()}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            options={[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(year => ({ value: year.toString(), label: year.toString() }))}
          />
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              {editingId ? 'Edit Budget' : 'Create New Budget'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categories.map(cat => ({ value: cat, label: cat }))}
                required
              />
              <Input
                label="Monthly Limit (Rp)"
                type="number"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="1000000"
                required
              />
              <Input
                label="Alert Threshold (%)"
                type="number"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                min="50"
                max="100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Warning when reaching this percentage
              </p>
              <div className="flex gap-2">
                <PrimaryButton type="submit" fullWidth>
                  {editingId ? 'Save Changes' : 'Create Budget'}
                </PrimaryButton>
                {editingId && (
                  <SecondaryButton
                    type="button"
                    onClick={resetForm}
                    fullWidth
                  >
                    Cancel
                  </SecondaryButton>
                )}
              </div>
            </form>
          </Card>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonBudget />
            <SkeletonBudget />
            <SkeletonBudget />
          </div>
        ) : budgets.length === 0 ? (
          <EmptyBudgets onAdd={() => setShowForm(true)} />
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget._id}
                category={budget.category}
                spent={budget.spent}
                limit={budget.monthlyLimit}
                remaining={budget.remaining}
                percentage={budget.percentage}
                status={budget.status}
                onEdit={() => handleEdit(budget)}
                onDelete={() => handleDelete(budget._id)}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        {budgets.length > 0 && (
          <Card className="mt-6 bg-primary-50 dark:bg-primary-900/20">
            <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-4">
              Monthly Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-primary-600">
                  {formatCurrency(budgets.reduce((sum, b) => sum + b.monthlyLimit, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Budget</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning-600">
                  {formatCurrency(budgets.reduce((sum, b) => sum + b.spent, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Spent</div>
              </div>
              <div>
                <div className="text-lg font-bold text-success-600">
                  {formatCurrency(budgets.reduce((sum, b) => sum + Math.max(0, b.remaining), 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Remaining</div>
              </div>
            </div>
          </Card>
        )}
      </PageContainer>
    </ProtectedRoute>
  );
}
