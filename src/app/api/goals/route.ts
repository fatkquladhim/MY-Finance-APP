import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import SavingGoal from '@/models/SavingGoal';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/goals - List all saving goals
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'active';

    const query: any = { userId: session.user.id };
    if (status !== 'all') {
      query.status = status;
    }

    const goals = await SavingGoal.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    const formattedGoals = goals.map((goal: any) => {
      const progress = goal.targetAmount > 0 
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100) 
        : 0;

      let daysRemaining = null;
      if (goal.deadline) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        ...goal,
        _id: goal._id.toString(),
        progress: Math.min(100, progress),
        daysRemaining,
        contributionsCount: goal.contributions?.length || 0,
        lastContribution: goal.contributions?.length > 0 
          ? goal.contributions[goal.contributions.length - 1] 
          : null
      };
    });

    return NextResponse.json(formattedGoals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new saving goal
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, targetAmount, deadline, priority, currentAmount } = body;

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: 'Name and targetAmount are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const goal = new SavingGoal({
      userId: session.user.id,
      name,
      targetAmount,
      currentAmount: currentAmount || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      priority: priority || 'medium',
      status: 'active',
      contributions: currentAmount > 0 ? [{
        amount: currentAmount,
        date: new Date(),
        note: 'Initial amount'
      }] : []
    });

    await goal.save();

    return NextResponse.json({
      ...goal.toObject(),
      _id: goal._id.toString(),
      progress: Math.round((goal.currentAmount / goal.targetAmount) * 100)
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}

// PUT /api/goals - Update a saving goal
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Only allow updating certain fields
    const allowedUpdates: Record<string, any> = {};
    if (updates.name !== undefined) allowedUpdates.name = updates.name;
    if (updates.targetAmount !== undefined) allowedUpdates.targetAmount = updates.targetAmount;
    if (updates.deadline !== undefined) allowedUpdates.deadline = updates.deadline ? new Date(updates.deadline) : null;
    if (updates.priority !== undefined) allowedUpdates.priority = updates.priority;
    if (updates.status !== undefined) allowedUpdates.status = updates.status;

    const goal = await SavingGoal.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      allowedUpdates,
      { new: true }
    );

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...goal.toObject(),
      _id: goal._id.toString(),
      progress: Math.round((goal.currentAmount / goal.targetAmount) * 100)
    });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals - Delete a saving goal
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const result = await SavingGoal.findOneAndDelete({
      _id: id,
      userId: session.user.id
    });

    if (!result) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Goal deleted' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
