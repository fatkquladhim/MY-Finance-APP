"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState<string | undefined>(session?.user?.name);
  const [bio, setBio] = useState<string | undefined>(session?.user?.bio);
  const { showToast } = useToast();

  useEffect(() => {
    setName(session?.user?.name);
    setBio(session?.user?.bio);
  }, [session]);

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 max-w-2xl mx-auto dark:text-white">
        <h1 className="text-2xl font-bold mb-4">Profil</h1>
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded shadow">
            {!editing ? (
              <>
                <p><strong>Nama:</strong> {session?.user?.name}</p>
                <p><strong>Email:</strong> {session?.user?.email}</p>
                <p><strong>ID:</strong> {session?.user?.id}</p>
                <div className="mt-3">
                  <button onClick={() => setEditing(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit Profil</button>
                </div>
              </>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, bio }) });
                  if (res.ok) {
                    showToast('Profil diperbarui', 'success');
                    setEditing(false);
                  } else {
                    showToast('Gagal memperbarui profil', 'error');
                  }
                } catch (err) { showToast('Kesalahan jaringan', 'error'); }
              }}>
                <div className="mb-3 grid grid-cols-1 gap-3">
                  <label className="text-sm">Nama</label>
                  <input value={name ?? ''} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700" />
                  <label className="text-sm">Bio</label>
                  <textarea value={bio ?? ''} onChange={(e) => setBio(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700" />
                </div>
                <div>
                  <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded mr-2">Simpan</button>
                  <button type="button" onClick={() => setEditing(false)} className="px-3 py-1 border rounded">Batal</button>
                </div>
              </form>
            )}
          </div>
      </div>
    </ProtectedRoute>
  );
}
