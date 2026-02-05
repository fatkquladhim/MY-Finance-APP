import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import SavingGoal from '@/models/SavingGoal';
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

    await connectToDatabase();

    const goal = await SavingGoal.findOne({
      _id: id,
      userId: session.user.id
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    if (goal.status !== 'active') {
      return NextResponse.json(
        { error: 'Cannot contribute to a non-active goal' },
        { status: 400 }
      );
    }

    // Add contribution
    goal.contributions.push({
      amount,
      date: new Date(),
      note: note || undefined
    });

    // Update current amount
    goal.currentAmount += amount;

    // Check if goal is completed
    if (goal.currentAmount >= goal.targetAmount) {
      goal.status = 'completed';
    }

    await goal.save();

    const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);

    return NextResponse.json({
      ...goal.toObject(),
      _id: goal._id.toString(),
      progress: Math.min(100, progress),
      message: goal.status === 'completed' 
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
