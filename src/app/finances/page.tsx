"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function FinancesPage() {
  const { showToast } = useToast();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [finances, setFinances] = useState<any[]>([]);

  useEffect(() => {
    const fetchFinances = async () => {
      const res = await fetch("/api/finances");
      const data = await res.json();
      setFinances(data);
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

  const handleEdit = (f: any) => {
    setEditingId(f._id);
    setAmount(String(f.amount));
    setCategory(f.category || "");
    setDescription(f.description || "");
    setType(f.type || "income");
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

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-2xl mx-auto dark:text-white">
        <h1 className="text-3xl font-bold mb-6">Manajemen Keuangan</h1>

        <form onSubmit={handleSubmit} className="mb-8 bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="text-xl mb-4">{type === "income" ? "Tambah Pendapatan" : "Tambah Pengeluaran"}</h2>
          <div className="mb-3">
            <label className="block">Jenis</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="border p-2 w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="income">Pendapatan</option>
              <option value="expense">Pengeluaran</option>
            </select>
          </div>
          <div className="mb-3">
            <label>Jumlah</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border p-2 w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            />
          </div>
          <div className="mb-3">
            <label>Kategori</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border p-2 w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
              required
            />
          </div>
          <div className="mb-3">
            <label>Deskripsi</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border p-2 w-full dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Simpan
          </button>
        </form>

        <div className="flex justify-between items-center mb-4">
          <h2>Riwayat Keuangan</h2>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm"
          >
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded hidden md:table">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">Tanggal</th>
                <th className="p-2 text-left">Kategori</th>
                <th className="p-2 text-left">Jumlah</th>
                <th className="p-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {finances.map((f) => (
                <tr key={f._id} className="border-b dark:border-gray-700">
                  <td className="py-2 px-4">{new Date(f.date).toLocaleDateString()}</td>
                  <td className="py-2 px-4">{f.category}</td>
                  <td className={`py-2 px-4 ${f.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {f.type === "income" ? "+" : "-"} Rp {f.amount.toLocaleString()}
                  </td>
                  <td className="py-2 px-4">
                    <button onClick={() => handleEdit(f)} className="text-sm text-blue-600 mr-2">Edit</button>
                    <button onClick={() => handleDelete(f._id)} className="text-sm text-red-600">Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {finances.map((f) => (
              <div key={f._id} className="p-3 bg-white dark:bg-gray-800 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{f.category}</div>
                    <div className="text-sm text-gray-500">{new Date(f.date).toLocaleDateString()}</div>
                    <div className={f.type === "income" ? "text-green-600" : "text-red-600"}>{f.type === "income" ? "+" : "-"} Rp {f.amount.toLocaleString()}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <button onClick={() => handleEdit(f)} className="text-sm text-blue-600 mb-2">Edit</button>
                    <button onClick={() => handleDelete(f._id)} className="text-sm text-red-600">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}