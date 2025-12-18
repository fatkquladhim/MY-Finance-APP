"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";

export default function PortfolioPage() {
  const [items, setItems] = useState<any[]>([]);
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
        res = await fetch('/api/portfolio', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...payload }) });
      } else {
        res = await fetch('/api/portfolio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      if (res.ok) {
        setItems(await (await fetch('/api/portfolio')).json());
        resetForm();
      } else {
        console.error(await res.text());
        alert('Gagal menyimpan portofolio');
      }
    } catch (err) {
      console.error(err);
      alert('Kesalahan jaringan');
    }
  };

  const handleEdit = (p: any) => {
    setEditingId(p._id);
    setAsset(p.asset || "");
    setPtype(p.type || 'stock');
    setQuantity(p.quantity || 1);
    setCurrentValue(p.currentValue || 0);
    setPurchasePrice(p.purchasePrice);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus item portofolio ini?')) return;
    try {
      const res = await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
      if (res.ok) setItems((prev) => prev.filter(i => i._id !== id));
      else alert('Gagal menghapus');
    } catch (err) { console.error(err); alert('Kesalahan jaringan'); }
  };

  return (
    <ProtectedRoute>
      <div className="p-6 max-w-4xl mx-auto dark:text-white">
        <h1 className="text-2xl font-bold mb-4">Portofolio</h1>

        <form onSubmit={handleSubmit} className="mb-6 bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={asset} onChange={(e) => setAsset(e.target.value)} placeholder="Asset" className="p-2 border rounded dark:bg-gray-700" required />
            <select value={ptype} onChange={(e) => setPtype(e.target.value as any)} className="p-2 border rounded dark:bg-gray-700">
              <option value="stock">Stock</option>
              <option value="crypto">Crypto</option>
              <option value="fund">Fund</option>
              <option value="property">Property</option>
            </select>
            <input type="number" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} className="p-2 border rounded dark:bg-gray-700" placeholder="Quantity" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <input type="number" value={currentValue} onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)} className="p-2 border rounded dark:bg-gray-700" placeholder="Current Value" />
            <input type="number" value={purchasePrice ?? ''} onChange={(e) => setPurchasePrice(e.target.value ? parseFloat(e.target.value) : undefined)} className="p-2 border rounded dark:bg-gray-700" placeholder="Purchase Price (optional)" />
          </div>
          <div className="mt-3">
            <button type="submit" className="bg-blue-600 text-white px-3 py-1 rounded mr-2">{editingId ? 'Update' : 'Tambah'}</button>
            {editingId && <button type="button" onClick={resetForm} className="px-3 py-1 rounded border">Batal</button>}
          </div>
        </form>

        {items.length === 0 ? (
          <p className="text-gray-500">Tidak ada data portofolio.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((p) => (
              <div key={p._id} className="p-3 bg-white dark:bg-gray-800 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{p.asset} <span className="text-sm text-gray-500">({p.type})</span></div>
                    <div className="text-sm text-gray-500">Qty: {p.quantity}</div>
                    <div className="text-sm">Rp {p.currentValue?.toLocaleString()}</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <button onClick={() => handleEdit(p)} className="text-sm text-blue-600">Edit</button>
                    <button onClick={() => handleDelete(p._id)} className="text-sm text-red-600">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
