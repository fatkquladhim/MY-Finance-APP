import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { BudgetModel } from '@/models/Budget';
import { Finance } from '@/models/Finance';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/budgets - List all budgets
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const year = url.searchParams.get('year') || new Date().getFullYear().toString();
    const month = url.searchParams.get('month') || (new Date().getMonth() + 1).toString().padStart(2, '0');

    const budgets = await BudgetModel.findByMonthYear(session.user.id, month, year);

    // Calculate spent amounts for each budget
    const monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Finance.getSummaryByCategory(
          session.user.id,
          'expense',
          monthStart,
          monthEnd
        );

        const spentAmount = spent.find(s => s.category === budget.category)?.total || 0;
        const amount = Number(budget.amount);
        const percentage = amount > 0 ? Math.round((spentAmount / amount) * 100) : 0;

        return {
          ...budget,
          spent: spentAmount,
          remaining: amount - spentAmount,
          percentage,
          status: percentage >= 100 ? 'exceeded' : percentage >= 80 ? 'warning' : 'ok'
        };
      })
    );

    return NextResponse.json(budgetsWithSpent);
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Create a new budget
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category, monthlyLimit, month, year } = body;

    if (!category || !monthlyLimit) {
      return NextResponse.json(
        { error: 'Category and monthlyLimit are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const budgetMonth = month || (now.getMonth() + 1).toString().padStart(2, '0');
    const budgetYear = year || now.getFullYear().toString();

    // Check if budget already exists for this category and period
    const existingBudgets = await BudgetModel.findByMonthYear(
      session.user.id,
      budgetMonth,
      budgetYear
    );

    if (existingBudgets.length > 0) {
      return NextResponse.json(
        { error: 'Budget already exists for this category and period' },
        { status: 400 }
      );
    }

    const budget = await BudgetModel.create({
      userId: session.user.id,
      category,
      amount: String(monthlyLimit),
      month: budgetMonth,
      year: budgetYear,
      spent: '0'
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    );
  }
}

// PUT /api/budgets - Update a budget
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body as { id: string } & Record<string, unknown>;

    if (!id) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await BudgetModel.findById(id);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const budget = await BudgetModel.update(id, updates);

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets - Delete a budget
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await BudgetModel.findById(id);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const result = await BudgetModel.delete(id);

    if (!result) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Budget deleted' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    );
  }
}
