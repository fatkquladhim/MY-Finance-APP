// Insights Types for AI Financial Assistant

export interface CategorySummary {
  category: string;
  total: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PortfolioSummary {
  totalValue: number;
  allocation: Record<string, number>;
  gainLoss: number;
}

export interface BudgetSummary {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
}

export interface GoalSummary {
  name: string;
  progress: number;
  daysRemaining: number | null;
}

export interface FinancialOverview {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  periodStart: string;
  periodEnd: string;
}

export interface FinancialSummary {
  overview: FinancialOverview;
  topCategories: CategorySummary[];
  portfolio: PortfolioSummary;
  budgets: BudgetSummary[];
  goals: GoalSummary[];
}

export interface Budget {
  _id: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  period: {
    month: number;
    year: number;
  };
  alertThreshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contribution {
  amount: number;
  date: Date;
  note?: string;
}

export interface SavingGoal {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'abandoned';
  contributions: Contribution[];
  createdAt: Date;
  updatedAt: Date;
}
