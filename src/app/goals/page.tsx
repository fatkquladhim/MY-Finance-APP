"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/useToast';

interface SavingGoal {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'abandoned';
  progress: number;
  daysRemaining: number | null;
  contributionsCount: number;
}

export default function GoalsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contributeModal, setContributeModal] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [contributeNote, setContributeNote] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [statusFilter, setStatusFilter] = useState<string>('active');

  useEffect(() => {
    if (session) {
      loadGoals();
    }
  }, [session, statusFilter]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/goals?status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (error) {
      console.error('Failed to load goals:', error);
      showToast('Gagal memuat data goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setPriority('medium');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline || undefined,
        priority,
        ...(editingId && { id: editingId })
      };

      const res = await fetch('/api/goals', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingId ? 'Goal diperbarui!' : 'Goal dibuat!', 'success');
        resetForm();
        loadGoals();
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal menyimpan goal', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const handleEdit = (goal: SavingGoal) => {
    setEditingId(goal._id);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setDeadline(goal.deadline ? goal.deadline.split('T')[0] : '');
    setPriority(goal.priority);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus goal ini?')) return;
    
    try {
      const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Goal dihapus', 'success');
        loadGoals();
      } else {
        showToast('Gagal menghapus goal', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const handleContribute = async (goalId: string) => {
    if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
      showToast('Masukkan jumlah yang valid', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/goals/${goalId}/contribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(contributeAmount),
          note: contributeNote || undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || 'Kontribusi ditambahkan!', 'success');
        setContributeModal(null);
        setContributeAmount('');
        setContributeNote('');
        loadGoals();
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal menambah kontribusi', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 max-w-4xl mx-auto dark:text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Saving Goals</h1>
            <p className="text-sm text-gray-500 mt-1">Tetapkan dan lacak target tabungan Anda</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showForm ? 'Tutup' : '+ Tambah Goal'}
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['active', 'completed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status === 'active' ? 'Aktif' : status === 'completed' ? 'Tercapai' : 'Semua'}
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? 'Edit Goal' : 'Buat Goal Baru'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Nama Goal</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Contoh: Dana Darurat, Liburan, dll"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Target (Rp)</label>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="10000000"
                  required
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah Awal (Rp)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="0"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Deadline (Opsional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="low">Rendah</option>
                  <option value="medium">Sedang</option>
                  <option value="high">Tinggi</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingId ? 'Simpan Perubahan' : 'Buat Goal'}
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

        {/* Goals List */}
        {loading ? (
          <div className="text-center py-8 text-gray-500">Memuat...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold mb-1">Belum ada goal</h3>
            <p className="text-gray-500 text-sm">Buat goal pertama Anda untuk mulai menabung</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal._id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 ${
                  goal.status === 'completed' ? 'border-green-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{goal.name}</h3>
                      {goal.status === 'completed' && (
                        <span className="text-green-500 text-xl">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(goal.currentAmount)} dari {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority === 'high' ? 'Tinggi' : goal.priority === 'medium' ? 'Sedang' : 'Rendah'}
                    </span>
                    {goal.status === 'active' && (
                      <button
                        onClick={() => setContributeModal(goal._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                      >
                        + Tambah
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(goal)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(goal._id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="relative mb-2">
                  <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(goal.progress)}`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-medium">{goal.progress}% tercapai</span>
                  <div className="flex gap-3">
                    {goal.daysRemaining !== null && (
                      <span>{goal.daysRemaining > 0 ? `${goal.daysRemaining} hari lagi` : 'Deadline lewat'}</span>
                    )}
                    <span>{goal.contributionsCount} kontribusi</span>
                  </div>
                </div>
                
                {/* Remaining amount */}
                {goal.status === 'active' && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                    Sisa yang dibutuhkan: <span className="font-semibold">{formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contribute Modal */}
        {contributeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setContributeModal(null)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold mb-4">Tambah Kontribusi</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Jumlah (Rp)</label>
                  <input
                    type="number"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="100000"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Catatan (Opsional)</label>
                  <input
                    type="text"
                    value={contributeNote}
                    onChange={(e) => setContributeNote(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Bonus gaji, dll"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => handleContribute(contributeModal)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Tambahkan
                </button>
                <button
                  onClick={() => setContributeModal(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {goals.filter(g => g.status === 'active').length > 0 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">Ringkasan Goals Aktif</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.targetAmount, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Target</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.currentAmount, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Terkumpul</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(
                    goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.progress, 0) / 
                    Math.max(1, goals.filter(g => g.status === 'active').length)
                  )}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Rata-rata Progress</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
