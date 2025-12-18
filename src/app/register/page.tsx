"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Register gagal");
      return;
    }
    alert("Registrasi berhasil — silakan masuk.");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Register</h1>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required
          />
        </div>
        <div className="mb-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required
          />
        </div>
        <div className="mb-6">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white dark:border-gray-600"
            required
          />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Daftar</button>
      </form>
    </div>
  );
}
