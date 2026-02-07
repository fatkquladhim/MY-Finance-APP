import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { SavingGoal } from '@/models/SavingGoal';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/goals/[id]/contribute - Add contribution to a goal
export async function POST(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { amount, note } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const goal = await SavingGoal.findById(id);

    if (!goal || goal.userId !== session.user.id) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot contribute to a non-active goal' },
        { status: 400 }
      );
    }

    // Add contribution
    await SavingGoal.addContribution(id, amount, note || undefined);

    // Get updated goal
    const updatedGoal = await SavingGoal.findById(id);
    if (!updatedGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    // Check if goal is completed
    const targetAmount = Number(updatedGoal.targetAmount);
    const currentAmount = Number(updatedGoal.currentAmount);
    
    if (currentAmount >= targetAmount) {
      await SavingGoal.update(id, { status: 'completed' });
    }

    const progress = Math.round((currentAmount / targetAmount) * 100);

    return NextResponse.json({
      ...updatedGoal,
      progress: Math.min(100, progress),
      message: currentAmount >= targetAmount 
        ? 'Congratulations! Goal completed!' 
        : 'Contribution added successfully'
    });
  } catch (error) {
    console.error('Error adding contribution:', error);
    return NextResponse.json(
      { error: 'Failed to add contribution' },
      { status: 500 }
    );
  }
}
