import { connectToDatabase } from './mongodb';
import Finance from '@/models/Finance';
import Portfolio from '@/models/Portfolio';
import Budget from '@/models/Budget';
import SavingGoal from '@/models/SavingGoal';
import { formatFinancialContext } from './prompts';
import type { FinancialSummary, CategorySummary, BudgetSummary, GoalSummary } from '@/types/insights';

export async function buildFinancialContext(userId: string): Promise<string> {
  await connectToDatabase();
  
  const summary = await getFinancialSummary(userId);
  return formatFinancialContext(summary);
}

export async function getFinancialSummary(userId: string): Promise<FinancialSummary> {
  await connectToDatabase();
  
  // Get date range for last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  // Fetch all data in parallel
  const [finances, portfolioItems, budgets, goals] = await Promise.all([
    Finance.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 }),
    Portfolio.find({ userId }),
    Budget.find({
      userId,
      isActive: true,
      'period.year': endDate.getFullYear(),
      'period.month': endDate.getMonth() + 1
    }),
    SavingGoal.find({ userId, status: 'active' })
  ]);
  
  // Calculate income and expenses
  const incomeTransactions = finances.filter((f: any) => f.type === 'income');
  const expenseTransactions = finances.filter((f: any) => f.type === 'expense');
  
  const totalIncome = incomeTransactions.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
  const totalExpense = expenseTransactions.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
  
  // Calculate top expense categories
  const categoryTotals: Record<string, number> = {};
  expenseTransactions.forEach((f: any) => {
    const category = f.category || 'Uncategorized';
    categoryTotals[category] = (categoryTotals[category] || 0) + (f.amount || 0);
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
  
  portfolioItems.forEach((p: any) => {
    const value = (p.currentValue || 0) * (p.quantity || 0);
    const purchase = (p.purchasePrice || p.currentValue || 0) * (p.quantity || 0);
    totalPortfolioValue += value;
    totalPurchaseValue += purchase;
    
    const type = p.type || 'other';
    portfolioAllocation[type] = (portfolioAllocation[type] || 0) + value;
  });
  
  // Calculate budget summaries
  const budgetSummaries: BudgetSummary[] = await Promise.all(
    budgets.map(async (b: any) => {
      // Calculate spent amount for this category in current month
      const monthStart = new Date(b.period.year, b.period.month - 1, 1);
      const monthEnd = new Date(b.period.year, b.period.month, 0);
      
      const spent = await Finance.aggregate([
        {
          $match: {
            userId,
            type: 'expense',
            category: b.category,
            date: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      const spentAmount = spent[0]?.total || 0;
      
      return {
        category: b.category,
        limit: b.monthlyLimit,
        spent: spentAmount,
        remaining: b.monthlyLimit - spentAmount
      };
    })
  );
  
  // Calculate goal summaries
  const goalSummaries: GoalSummary[] = goals.map((g: any) => {
    const progress = g.targetAmount > 0 
      ? Math.round((g.currentAmount / g.targetAmount) * 100) 
      : 0;
    
    let daysRemaining: number | null = null;
    if (g.deadline) {
      const now = new Date();
      const deadline = new Date(g.deadline);
      daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }
    
    return {
      name: g.name,
      progress: Math.min(100, progress),
      daysRemaining
    };
  });
  
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
