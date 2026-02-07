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
  LineElement,
  PointElement,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useSession } from "next-auth/react";
import ProtectedRoute from "@/components/ProtectedRoute";
import PageContainer from "@/components/layout/PageContainer";
import StatCard from "@/components/ui/cards/StatCard";
import Card from "@/components/ui/cards/Card";
import TransactionCard from "@/components/ui/cards/TransactionCard";
import { SkeletonCard, SkeletonTransaction } from "@/components/ui/loading/Skeleton";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement);

export default function Dashboard() {
  const { data: session } = useSession();
  const [finances, setFinances] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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
  const totalBalance = netWorth + totalIncome - totalExpense;

  const chartData = {
    labels: ["Income", "Expense", "Net Worth"],
    datasets: [
      {
        label: "Amount (Rp)",
        data: [totalIncome, totalExpense, netWorth],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f9fafb',
        bodyColor: '#f9fafb',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false,
        },
        ticks: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <ProtectedRoute>
      <PageContainer>
        {/* Hero Section */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-1">
            Welcome back, {session?.user?.name || 'User'}!
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            It's the best time to manage your finances
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <StatCard
                title="Total Balance"
                value={formatCurrency(totalBalance)}
                delta="+12.1%"
                deltaPositive={true}
                icon="💰"
              />
              <StatCard
                title="Income"
                value={formatCurrency(totalIncome)}
                delta="+6.3%"
                deltaPositive={true}
                icon="📈"
              />
              <StatCard
                title="Expense"
                value={formatCurrency(totalExpense)}
                delta="-2.4%"
                deltaPositive={false}
                icon="📉"
              />
              <StatCard
                title="Total Savings"
                value={formatCurrency(netWorth)}
                delta="+12.1%"
                deltaPositive={true}
                icon="💎"
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Money Flow">
              <div style={{ minHeight: 300 }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-pulse-soft text-gray-400">Loading chart...</div>
                  </div>
                ) : (
                  <Line data={chartData} options={chartOptions} />
                )}
              </div>
            </Card>
            
            {/* Recent Transactions */}
            <Card title="Recent Transactions">
              <div className="space-y-3">
                {loading ? (
                  <>
                    <SkeletonTransaction />
                    <SkeletonTransaction />
                    <SkeletonTransaction />
                  </>
                ) : finances.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No transactions yet
                  </div>
                ) : (
                  finances.slice(0, 6).map(f => (
                    <TransactionCard
                      key={f._id}
                      category={f.category}
                      amount={f.amount}
                      type={f.type}
                      date={new Date(f.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      description={f.description}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Budget Overview */}
            <Card title="Budget Overview">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Cafe & Restaurants</div>
                  <div className="text-sm font-medium">25%</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: '25%' }} />
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Saving Goals</div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <div>MacBook Pro</div>
                        <div className="font-medium">Rp 1.650.000</div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: '25%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <div>New Car</div>
                        <div className="font-medium">Rp 60.000.000</div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: '42%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
