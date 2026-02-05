"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/useToast';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'warning': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto dark:text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Budget Bulanan</h1>
            <p className="text-sm text-gray-500 mt-1">Kelola dan pantau budget pengeluaran Anda</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showForm ? 'Tutup' : '+ Tambah Budget'}
          </button>
        </div>

        {/* Month/Year Selector */}
        <div className="flex gap-3 mb-6">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx + 1}>{month}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Budget' : 'Buat Budget Baru'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                >
                  <option value="">Pilih kategori</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Limit Bulanan (Rp)</label>
                <input
                  type="number"
                  value={monthlyLimit}
                  onChange={(e) => setMonthlyLimit(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="1000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alert Threshold (%)</label>
                <input
                  type="number"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  min="50"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Peringatan saat mencapai persentase ini</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Simpan Perubahan' : 'Buat Budget'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Memuat...</div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold mb-1">Belum ada budget</h3>
            <p className="text-gray-500 text-sm">Buat budget pertama Anda untuk mulai melacak pengeluaran</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div
                key={budget._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{budget.category}</h3>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(budget.spent)} dari {formatCurrency(budget.monthlyLimit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                      {budget.status === 'exceeded' ? 'Melebihi' : budget.status === 'warning' ? 'Hampir' : 'Aman'}
                    </span>
                    <button
                      onClick={() => handleEdit(budget)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget._id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="relative">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(budget.percentage)}`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>{budget.percentage}% terpakai</span>
                    <span>Sisa: {formatCurrency(Math.max(0, budget.remaining))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {budgets.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Ringkasan Bulan Ini</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(budgets.reduce((sum, b) => sum + b.monthlyLimit, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Budget</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {formatCurrency(budgets.reduce((sum, b) => sum + b.spent, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Terpakai</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(budgets.reduce((sum, b) => sum + Math.max(0, b.remaining), 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Sisa</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
