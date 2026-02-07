import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Budget from '@/models/Budget';
import Finance from '@/models/Finance';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/budgets - List all budgets
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const activeOnly = url.searchParams.get('active') !== 'false';

    const budgets = await Budget.find({
      userId: session.user.id,
      year,
      month,
      isActive: activeOnly ? true : undefined
    });

    // Calculate spent amounts for each budget
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await Finance.aggregate([
          {
            $match: {
              userId: session.user.id,
              type: 'expense',
              category: budget.category,
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

        const spentAmount = (Array.isArray(spent) && spent.length > 0 && 'total' in spent[0] && typeof spent[0].total === 'number') ? spent[0].total : 0;
        const percentage = Math.round((spentAmount / budget.monthly_limit) * 100);

        return {
          ...budget,
          id: budget.id,
          spent: spentAmount,
          remaining: budget.monthly_limit - spentAmount,
          percentage,
          status: percentage >= 100 ? 'exceeded' : percentage >= budget.alert_threshold ? 'warning' : 'ok'
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
    const { category, monthlyLimit, month, year, alertThreshold } = body;

    if (!category || !monthlyLimit) {
      return NextResponse.json(
        { error: 'Category and monthlyLimit are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const budgetMonth = month || now.getMonth() + 1;
    const budgetYear = year || now.getFullYear();

    // Check if budget already exists for this category and period
    const existingBudgets = await Budget.find({
      userId: session.user.id,
      category,
      year: budgetYear,
      month: budgetMonth
    });

    if (existingBudgets.length > 0) {
      return NextResponse.json(
        { error: 'Budget already exists for this category and period' },
        { status: 400 }
      );
    }

    const budget = await Budget.create({
      user_id: session.user.id,
      category,
      monthly_limit: monthlyLimit,
      period_month: budgetMonth,
      period_year: budgetYear,
      alert_threshold: alertThreshold || 80,
      is_active: true
    });

    return NextResponse.json({
      ...budget,
      id: budget.id
    }, { status: 201 });
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
    const { id, ...updates } = body as { id: string } & { monthly_limit?: number; alert_threshold?: number; is_active?: boolean };

    if (!id) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    const budget = await Budget.findOneAndUpdate(
      { id, userId: session.user.id },
      updates
    );

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...budget,
      id: budget.id
    });
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

    const result = await Budget.findOneAndDelete({
      id,
      userId: session.user.id
    });

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
