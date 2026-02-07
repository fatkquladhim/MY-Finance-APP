"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import PageContainer from "@/components/layout/PageContainer";
import { useEffect, useState } from "react";
import PrimaryButton from "@/components/ui/buttons/PrimaryButton";
import SecondaryButton from "@/components/ui/buttons/SecondaryButton";
import Input from "@/components/ui/forms/Input";
import Select from "@/components/ui/forms/Select";
import Card from "@/components/ui/cards/Card";

interface PortfolioItem {
  _id: string;
  asset: string;
  type: 'stock' | 'crypto' | 'fund' | 'property';
  quantity: number;
  currentValue: number;
  purchasePrice?: number;
}

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [asset, setAsset] = useState("");
  const [ptype, setPtype] = useState<"stock" | "crypto" | "fund" | "property">("stock");
  const [quantity, setQuantity] = useState(1);
  const [currentValue, setCurrentValue] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState<number | undefined>(undefined);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/portfolio');
      if (res.ok) {
        setItems(await res.json());
      }
    };
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setAsset("");
    setPtype("stock");
    setQuantity(1);
    setCurrentValue(0);
    setPurchasePrice(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { asset, type: ptype, quantity, currentValue, purchasePrice };
    try {
      let res: Response;
      if (editingId) {
        res = await fetch('/api/portfolio', { 
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ id: editingId, ...payload }) 
        });
      } else {
        res = await fetch('/api/portfolio', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify(payload) 
        });
      }
      if (res.ok) {
        const updated = await fetch('/api/portfolio');
        setItems(await updated.json());
        resetForm();
      } else {
        alert('Gagal menyimpan portofolio');
      }
    } catch (err) {
      console.error(err);
      alert('Kesalahan jaringan');
    }
  };

  const handleEdit = (p: PortfolioItem) => {
    setEditingId(p._id);
    setAsset(p.asset || "");
    setPtype(p.type || "stock");
    setQuantity(p.quantity || 1);
    setCurrentValue(p.currentValue || 0);
    setPurchasePrice(p.purchasePrice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item portofolio ini?')) return;
    try {
      const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((prev) => prev.filter((i: PortfolioItem) => i._id !== id));
      } else {
        alert('Gagal menghapus');
      }
    } catch (err) {
      console.error(err);
      alert('Kesalahan jaringan');
    }
  };

  const formatCurrency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
            Portfolio
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track your investments and assets
          </p>
        </div>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-dark-text-primary">
            {editingId ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Asset Name"
                type="text"
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                placeholder="e.g., Apple Stock, Bitcoin"
                required
              />
              <Select
                label="Type"
                value={ptype}
                onChange={(e) => setPtype(e.target.value as 'stock' | 'crypto' | 'fund' | 'property')}
                options={[
                  { value: 'stock', label: 'Stock' },
                  { value: 'crypto', label: 'Crypto' },
                  { value: 'fund', label: 'Fund' },
                  { value: 'property', label: 'Property' },
                ]}
              />
              <Input
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                placeholder="1"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Current Value (Rp)"
                type="number"
                value={currentValue}
                onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
              />
              <Input
                label="Purchase Price (Rp)"
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
            <div className="flex gap-2 md:col-span-3">
              <PrimaryButton type="submit" fullWidth>
                {editingId ? 'Update' : 'Add Item'}
              </PrimaryButton>
              {editingId && (
                <SecondaryButton type="button" onClick={resetForm} fullWidth>
                  Cancel
                </SecondaryButton>
              )}
            </div>
          </form>
        </Card>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-dark-text-primary">
              No portfolio items yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Start tracking your investments by adding your first item
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((p: PortfolioItem) => (
              <Card key={p._id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl">
                      {p.type === 'stock' && '📈'}
                      {p.type === 'crypto' && '₿'}
                      {p.type === 'fund' && '💰'}
                      {p.type === 'property' && '🏠'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">{p.asset}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{p.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(p)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p._id)} className="text-error-600 hover:text-error-700 text-sm font-medium">
                      Hapus
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </ProtectedRoute>
  );
}
