"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageContainer from "@/components/layout/PageContainer";
import TransactionCard from "@/components/ui/cards/TransactionCard";
import { EmptyTransactions } from "@/components/ui/feedback/EmptyState";
import { SkeletonTransaction } from "@/components/ui/loading/Skeleton";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import Input from "@/components/ui/forms/Input";
import Select from "@/components/ui/forms/Select";
import Card from "@/components/ui/cards/Card";

interface Finance {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

export default function FinancesPage() {
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const fetchFinances = async () => {
      const res = await fetch("/api/finances");
      const data = await res.json();
      setFinances(data);
      setLoading(false);
    };
    fetchFinances();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { amount: parseFloat(amount), category, description, type };
      let res: Response;
      if (editingId) {
        res = await fetch("/api/finances", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
      } else {
        res = await fetch("/api/finances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (res.ok) {
        showToast(editingId ? "Transaksi berhasil diperbarui!" : "Transaksi berhasil ditambahkan!", "success");
        setAmount("");
        setCategory("");
        setDescription("");
        setEditingId(null);
        setShowForm(false);
        const updated = await fetch("/api/finances");
        setFinances(await updated.json());
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || "Gagal menyimpan transaksi.", "error");
      }
    } catch (err) {
      showToast("Terjadi kesalahan jaringan.", "error");
    }
  };

  const handleEdit = (f: Finance) => {
    setEditingId(f._id);
    setAmount(String(f.amount));
    setCategory(f.category || "");
    setDescription(f.description || "");
    setType(f.type || "income");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus transaksi ini?')) return;
    try {
      const res = await fetch(`/api/finances?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Transaksi dihapus', 'success');
        setFinances((prev) => prev.filter(f => f._id !== id));
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Gagal menghapus', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan.', 'error');
    }
  };

  const exportToCSV = () => {
    const data = finances.map(f => ({
      Tanggal: new Date(f.date).toLocaleDateString(),
      Jenis: f.type === "income" ? "Pendapatan" : "Pengeluaran",
      Kategori: f.category,
      Deskripsi: f.description || "-",
      Jumlah: f.amount
    }));
    
    const headers = ["Tanggal", "Jenis", "Kategori", "Deskripsi", "Jumlah"];
    const csvRows = [
      headers.join(","),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(","))
    ];
    const csvContent = csvRows.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keuangan.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const typeOptions = [
    { value: 'income', label: 'Pendapatan' },
    { value: 'expense', label: 'Pengeluaran' },
  ];

  const categories = [
    'Makanan & Minuman',
    'Transportasi',
    'Belanja',
    'Hiburan',
    'Kesehatan',
    'Pendidikan',
    'Tagihan & Utilitas',
    'Gaji',
    'Bonus',
    'Investasi',
    'Lainnya'
  ];

  return (
    <ProtectedRoute>
      <PageContainer>
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
              Transactions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Track your income and expenses
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="btn btn-success"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <PrimaryButton
            onClick={() => { setType('income'); setShowForm(true); }}
            fullWidth
          >
            + Add Income
          </PrimaryButton>
          <SecondaryButton
            onClick={() => { setType('expense'); setShowForm(true); }}
            fullWidth
          >
            + Add Expense
          </SecondaryButton>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
              {editingId ? 'Edit Transaction' : 'Add Transaction'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select
                label="Type"
                value={type}
                onChange={(e) => setType(e.target.value as 'income' | 'expense')}
                options={typeOptions}
              />
              <Input
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100000"
                required
              />
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={categories.map(cat => ({ value: cat, label: cat }))}
                required
              />
              <Input
                label="Description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
              <div className="flex gap-2">
                <PrimaryButton type="submit" fullWidth>
                  {editingId ? 'Update' : 'Save'}
                </PrimaryButton>
                {editingId && (
                  <SecondaryButton
                    type="button"
                    onClick={() => { setShowForm(false); setEditingId(null); }}
                    fullWidth
                  >
                    Cancel
                  </SecondaryButton>
                )}
              </div>
            </form>
          </Card>
        )}

        {/* Transaction List */}
        {loading ? (
          <div className="space-y-3">
            <SkeletonTransaction />
            <SkeletonTransaction />
            <SkeletonTransaction />
            <SkeletonTransaction />
            <SkeletonTransaction />
          </div>
        ) : finances.length === 0 ? (
          <EmptyTransactions onAdd={() => setShowForm(true)} />
        ) : (
          <div className="space-y-3">
            {finances.map((f) => (
              <TransactionCard
                key={f._id}
                category={f.category}
                amount={f.amount}
                type={f.type}
                date={new Date(f.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                description={f.description}
                onEdit={() => handleEdit(f)}
                onDelete={() => handleDelete(f._id)}
              />
            ))}
          </div>
        )}
      </PageContainer>
    </ProtectedRoute>
  );
}
