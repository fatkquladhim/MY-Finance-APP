import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
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
    await connectToDatabase();

    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
    const activeOnly = url.searchParams.get('active') !== 'false';

    const query: any = {
      userId: session.user.id,
      'period.year': year,
      'period.month': month
    };

    if (activeOnly) {
      query.isActive = true;
    }

    const budgets = await Budget.find(query).sort({ category: 1 }).lean();

    // Calculate spent amounts for each budget
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget: any) => {
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

        const spentAmount = spent[0]?.total || 0;
        const percentage = Math.round((spentAmount / budget.monthlyLimit) * 100);

        return {
          ...budget,
          _id: budget._id.toString(),
          spent: spentAmount,
          remaining: budget.monthlyLimit - spentAmount,
          percentage,
          status: percentage >= 100 ? 'exceeded' : percentage >= budget.alertThreshold ? 'warning' : 'ok'
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

    await connectToDatabase();

    const now = new Date();
    const budgetMonth = month || now.getMonth() + 1;
    const budgetYear = year || now.getFullYear();

    // Check if budget already exists for this category and period
    const existingBudget = await Budget.findOne({
      userId: session.user.id,
      category,
      'period.year': budgetYear,
      'period.month': budgetMonth
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: 'Budget already exists for this category and period' },
        { status: 400 }
      );
    }

    const budget = new Budget({
      userId: session.user.id,
      category,
      monthlyLimit,
      period: {
        month: budgetMonth,
        year: budgetYear
      },
      alertThreshold: alertThreshold || 80,
      isActive: true
    });

    await budget.save();

    return NextResponse.json({
      ...budget.toObject(),
      _id: budget._id.toString()
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Budget ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Only allow updating certain fields
    const allowedUpdates: Record<string, any> = {};
    if (updates.monthlyLimit !== undefined) allowedUpdates.monthlyLimit = updates.monthlyLimit;
    if (updates.alertThreshold !== undefined) allowedUpdates.alertThreshold = updates.alertThreshold;
    if (updates.isActive !== undefined) allowedUpdates.isActive = updates.isActive;

    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      allowedUpdates,
      { new: true }
    );

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...budget.toObject(),
      _id: budget._id.toString()
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

    await connectToDatabase();

    const result = await Budget.findOneAndDelete({
      _id: id,
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
