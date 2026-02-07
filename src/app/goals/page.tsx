"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';
import PageContainer from '@/components/layout/PageContainer';
import { useToast } from '@/hooks/useToast';
import GoalCard from '@/components/ui/cards/GoalCard';
import { EmptyGoals } from '@/components/ui/feedback/EmptyState';
import { SkeletonGoal } from '@/components/ui/loading/Skeleton';
import PrimaryButton from '@/components/ui/buttons/PrimaryButton';
import SecondaryButton from '@/components/ui/buttons/SecondaryButton';
import Input from '@/components/ui/forms/Input';
import Select from '@/components/ui/forms/Select';
import Card from '@/components/ui/cards/Card';

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

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <ProtectedRoute>
      <PageContainer>
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
              Saving Goals
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set and track your savings targets
            </p>
          </div>
          <PrimaryButton
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Close' : '+ Add Goal'}
          </PrimaryButton>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['active', 'completed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
              }`}
            >
              {status === 'active' ? 'Active' : status === 'completed' ? 'Completed' : 'All'}
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              {editingId ? 'Edit Goal' : 'Create New Goal'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Goal Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Emergency Fund, Vacation, etc."
                required
              />
              <Input
                label="Target Amount (Rp)"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="10000000"
                required
              />
              {!editingId && (
                <Input
                  label="Initial Amount (Rp)"
                  type="number"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  placeholder="0"
                />
              )}
              <Input
                label="Deadline (Optional)"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <Select
                label="Priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]}
              />
              <div className="flex gap-2">
                <PrimaryButton type="submit" fullWidth>
                  {editingId ? 'Save Changes' : 'Create Goal'}
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

        {/* Goals List */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonGoal />
            <SkeletonGoal />
            <SkeletonGoal />
          </div>
        ) : goals.length === 0 ? (
          <EmptyGoals onAdd={() => setShowForm(true)} />
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal._id}
                name={goal.name}
                currentAmount={goal.currentAmount}
                targetAmount={goal.targetAmount}
                progress={goal.progress}
                daysRemaining={goal.daysRemaining}
                priority={goal.priority}
                status={goal.status}
                contributionsCount={goal.contributionsCount}
                onEdit={() => handleEdit(goal)}
                onDelete={() => handleDelete(goal._id)}
                onContribute={() => setContributeModal(goal._id)}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        {goals.filter(g => g.status === 'active').length > 0 && (
          <Card className="mt-6 bg-success-50 dark:bg-success-900/20">
            <h3 className="font-semibold text-success-900 dark:text-success-100 mb-4">
              Active Goals Summary
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-success-600">
                  {formatCurrency(goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.targetAmount, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Target</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary-600">
                  {formatCurrency(goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.currentAmount, 0))}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Saved</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning-600">
                  {Math.round(
                    goals.filter(g => g.status === 'active').reduce((sum, g) => sum + g.progress, 0) / 
                    Math.max(1, goals.filter(g => g.status === 'active').length)
                  )}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Avg Progress</div>
              </div>
            </div>
          </Card>
        )}

        {/* Contribute Modal */}
        {contributeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setContributeModal(null)} />
            <Card className="relative max-w-sm w-full shadow-large">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
                Add Contribution
              </h3>
              <div className="space-y-4">
                <Input
                  label="Amount (Rp)"
                  type="number"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="100000"
                  autoFocus
                />
                <Input
                  label="Note (Optional)"
                  type="text"
                  value={contributeNote}
                  onChange={(e) => setContributeNote(e.target.value)}
                  placeholder="Salary bonus, etc."
                />
              </div>
              <div className="flex gap-2 mt-6">
                <PrimaryButton
                  onClick={() => handleContribute(contributeModal)}
                  fullWidth
                >
                  Add
                </PrimaryButton>
                <SecondaryButton
                  onClick={() => setContributeModal(null)}
                  fullWidth
                >
                  Cancel
                </SecondaryButton>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </ProtectedRoute>
  );
}
