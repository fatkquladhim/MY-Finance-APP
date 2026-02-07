import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SavingGoal } from '@/models/SavingGoal';
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

    const goals = status === 'all'
      ? await SavingGoal.findByUserId(session.user.id)
      : await SavingGoal.findByStatus(session.user.id, status);

    const formattedGoals = await Promise.all(goals.map(async (goal) => {
      const progress = await SavingGoal.getProgress(goal.id);
      const progressPercentage = progress?.percentage || 0;

      let daysRemaining: number | null = null;
      if (goal.deadline) {
        const now = new Date();
        const deadline = new Date(goal.deadline);
        daysRemaining = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      return {
        ...goal,
        progress: Math.min(100, progressPercentage),
        daysRemaining,
        contributionsCount: 0, // Will be populated if needed
        lastContribution: null
      };
    }));

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
    const { name, targetAmount, deadline, currentAmount } = body;

    if (!name || !targetAmount) {
      return NextResponse.json(
        { error: 'Name and targetAmount are required' },
        { status: 400 }
      );
    }

    const goal = await SavingGoal.create({
      userId: session.user.id,
      name,
      targetAmount: String(targetAmount),
      currentAmount: String(currentAmount || 0),
      deadline: deadline ? new Date(deadline) : undefined,
      status: 'active'
    });

    // Add initial contribution if currentAmount > 0
    if (currentAmount && currentAmount > 0) {
      await SavingGoal.addContribution(goal.id, currentAmount, 'Initial amount');
    }

    const progress = await SavingGoal.getProgress(goal.id);

    return NextResponse.json({
      ...goal,
      progress: progress?.percentage || 0
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
    const { id, ...updates } = body as { id: string } & Record<string, unknown>;

    if (!id) {
      return NextResponse.json({ error: 'Goal ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await SavingGoal.findById(id);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const goal = await SavingGoal.update(id, updates);

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const progress = await SavingGoal.getProgress(id);

    return NextResponse.json({
      ...goal,
      progress: progress?.percentage || 0
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

    // Verify ownership
    const existing = await SavingGoal.findById(id);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const result = await SavingGoal.delete(id);

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
