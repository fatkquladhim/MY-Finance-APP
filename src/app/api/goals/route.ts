import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import SavingGoal from '@/models/SavingGoal';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/goals - List all saving goals
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || 'active';

    const goals = await SavingGoal.find({
      userId: session.user.id,
      status: status === 'all' ? undefined : status
    });

    const formattedGoals = goals.map((goal) => {
      const progress = goal.target_amount > 0 
        ? Math.round((goal.current_amount / goal.target_amount) * 100) 
        : 0;

      let daysRemaining: number | null = null;
      if (goal.deadline) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        ...goal,
        id: goal.id,
        progress: Math.min(100, progress),
        daysRemaining,
        contributionsCount: 0, // Will be populated if needed
        lastContribution: null
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

    const goal = await SavingGoal.create({
      user_id: session.user.id,
      name,
      target_amount: targetAmount,
      current_amount: currentAmount || 0,
      deadline: deadline ? new Date(deadline) : undefined,
      priority: (priority as 'low' | 'medium' | 'high') || 'medium',
      status: 'active'
    });

    // Add initial contribution if currentAmount > 0
    if (currentAmount && currentAmount > 0) {
      await SavingGoal.addContribution({
        goal_id: goal.id,
        amount: currentAmount,
        note: 'Initial amount'
      });
    }

    return NextResponse.json({
      ...goal,
      id: goal.id,
      progress: Math.round((goal.current_amount / goal.target_amount) * 100)
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
    const { id, ...updates } = body as { id: string } & { name?: string; target_amount?: number; deadline?: Date; priority?: string; status?: string };

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    const goal = await SavingGoal.findOneAndUpdate(
      { id, userId: session.user.id },
      updates as { name?: string; target_amount?: number; deadline?: Date; priority?: 'low' | 'medium' | 'high'; status?: 'active' | 'completed' | 'abandoned' }
    );

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...goal,
      id: goal.id,
      progress: Math.round((goal.current_amount / goal.target_amount) * 100)
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

    const result = await SavingGoal.findOneAndDelete({
      id,
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
