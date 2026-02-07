import { Finance } from '@/models/Finance';
import { Portfolio } from '@/models/Portfolio';
import { Budget } from '@/models/Budget';
import { SavingGoal } from '@/models/SavingGoal';
import { formatFinancialContext } from './prompts';
import type { FinancialSummary, CategorySummary, BudgetSummary, GoalSummary } from '@/types/insights';

export async function buildFinancialContext(userId: string): Promise<string> {
  const summary = await getFinancialSummary(userId);
  return formatFinancialContext(summary);
}

export async function getFinancialSummary(userId: string): Promise<FinancialSummary> {
  // Get date range for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  // Fetch all data in parallel
  const [finances, portfolioItems, budgets, goals] = await Promise.all([
    Finance.findByDateRange(userId, startDate, endDate),
    Portfolio.findByUserId(userId),
    Budget.findByMonthYear(
      userId,
      (endDate.getMonth() + 1).toString().padStart(2, '0'),
      endDate.getFullYear().toString()
    ),
    SavingGoal.findByStatus(userId, 'active')
  ]);
  
  // Calculate income and expenses
  const incomeTransactions = finances.filter((f) => f.type === 'income');
  const expenseTransactions = finances.filter((f) => f.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const totalExpense = expenseTransactions.reduce((sum, f) => sum + Number(f.amount || 0), 0);
  
  // Calculate top expense categories
  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach((f) => {
    const category = f.category || 'Uncategorized';
    categoryTotals[category] = (categoryTotals[category] || 0) + Number(f.amount || 0);
  });
  
  const topCategories: CategorySummary[] = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, total]) => ({
      category,
      total,
      percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
      trend: 'stable' as const // Would need historical data to calculate trend
    }));
  
  // Calculate portfolio summary
  const portfolioAllocation: Record<string, number> = {};
  let totalPortfolioValue = 0;
  let totalPurchaseValue = 0;
  
  portfolioItems.forEach((p) => {
    const value = Number(p.totalValue || 0);
    const purchase = Number(p.averagePrice || 0) * Number(p.quantity || 0);
    totalPortfolioValue += value;
    totalPurchaseValue += purchase;
    
    const type = p.type || 'other';
    portfolioAllocation[type] = (portfolioAllocation[type] || 0) + value;
  });
  
  // Calculate budget summaries
  const budgetSummaries: BudgetSummary[] = await Promise.all(
    budgets.map(async (b) => {
      // Calculate spent amount for this category in current month
      const monthStart = new Date(parseInt(b.year), parseInt(b.month) - 1, 1);
      const monthEnd = new Date(parseInt(b.year), parseInt(b.month), 0, 23, 59, 59);
      
      const spent = await Finance.getSummaryByCategory(
        userId,
        'expense',
        monthStart,
        monthEnd
      );
      
      const spentAmount = spent.find(s => s.category === b.category)?.total || 0;
      const limit = Number(b.amount || 0);
      
      return {
        category: b.category,
        limit,
        spent: spentAmount,
        remaining: limit - spentAmount
      };
    })
  );
  
  // Calculate goal summaries
  const goalSummaries: GoalSummary[] = await Promise.all(
    goals.map(async (g) => {
      const progress = await SavingGoal.getProgress(g.id);
      const progressPercentage = progress?.percentage || 0;
      
      let daysRemaining: number | null = null;
      if (g.deadline) {
        const now = new Date();
        const deadline = new Date(g.deadline);
        daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }
      
      return {
        name: g.name,
        progress: Math.min(100, progressPercentage),
        daysRemaining
      };
    })
  );
  
  return {
    overview: {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      periodStart: startDate.toLocaleDateString('id-ID'),
      periodEnd: endDate.toLocaleDateString('id-ID')
    },
    topCategories,
    portfolio: {
      totalValue: totalPortfolioValue,
      allocation: portfolioAllocation,
      gainLoss: totalPortfolioValue - totalPurchaseValue
    },
    budgets: budgetSummaries,
    goals: goalSummaries
  };
}
