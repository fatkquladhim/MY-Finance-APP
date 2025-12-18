"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useSession } from "next-auth/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatTile from "@/components/StatTile";
import DashboardCard from "@/components/DashboardCard";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Dashboard() {
  const { data: session } = useSession();
  const [finances, setFinances] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      const [finRes, portRes] = await Promise.all([
        fetch("/api/finances"),
        fetch("/api/portfolio")
      ]);
      const finData = await finRes.json().catch(() => []);
      const portData = await portRes.json().catch(() => []);
      setFinances(finData || []);
      setPortfolio(portData || []);
    };
    if (session) fetchData();
  }, [session]);

  const totalIncome = finances
    .filter(f => f.type === "income")
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  const totalExpense = finances
    .filter(f => f.type === "expense")
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  const netWorth = portfolio.reduce((sum, p) => sum + ((p.currentValue || 0) * (p.quantity || 0)), 0);

  const chartData = {
    labels: ["Pendapatan", "Pengeluaran", "Kekayaan Bersih"],
    datasets: [
      {
        label: "Jumlah (Rp)",
        data: [totalIncome, totalExpense, netWorth],
        backgroundColor: ["#4ade80", "#f87171", "#60a5fa"],
      },
    ],
  };

  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto dark:text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {session?.user?.name || 'User'}!</h1>
            <p className="text-sm text-gray-500">It is the best time to manage your finances</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatTile title="Total balance" value={`Rp ${ (netWorth + totalIncome - totalExpense).toLocaleString() }`} delta="+12.1%" />
          <StatTile title="Income" value={`Rp ${ totalIncome.toLocaleString() }`} delta="+6.3%" />
          <StatTile title="Expense" value={`Rp ${ totalExpense.toLocaleString() }`} delta="-2.4%" />
          <StatTile title="Total savings" value={`Rp ${ netWorth.toLocaleString() }`} delta="+12.1%" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardCard title="Money flow">
              <div style={{ minHeight: 260 }}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </DashboardCard>
            <div className="mt-4">
              <DashboardCard title="Recent transactions">
                <div className="overflow-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-sm text-gray-500">
                        <th className="py-2">Date</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finances.slice(0,6).map(f => (
                        <tr key={f._id} className="border-t">
                          <td className="py-2 text-sm text-gray-600">{new Date(f.date).toLocaleDateString()}</td>
                          <td className={`text-sm ${f.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{f.type === 'income' ? '+' : '-'} Rp {f.amount.toLocaleString()}</td>
                          <td className="text-sm">{f.category}</td>
                          <td className="text-sm text-gray-600">{f.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardCard>
            </div>
          </div>

          <div>
            <DashboardCard title="Budget">
              <div className="space-y-3">
                <div className="flex justify-between"><div className="text-sm text-gray-600">Cafe & Restaurants</div><div className="text-sm">25%</div></div>
                <div className="w-full bg-gray-200 rounded h-2"><div className="bg-purple-500 h-2 rounded" style={{ width: '25%' }} /></div>
                <div className="mt-4">
                  <div className="text-sm text-gray-600">Saving goals</div>
                  <div className="space-y-3 mt-2">
                    <div>
                      <div className="flex justify-between text-sm"><div>MacBook Pro</div><div>$1,650</div></div>
                      <div className="w-full bg-gray-200 rounded h-2 mt-1"><div className="bg-indigo-500 h-2 rounded" style={{ width: '25%' }} /></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm"><div>New car</div><div>$60,000</div></div>
                      <div className="w-full bg-gray-200 rounded h-2 mt-1"><div className="bg-indigo-500 h-2 rounded" style={{ width: '42%' }} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}