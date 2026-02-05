import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getFinancialSummary } from '@/lib/context-builder';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { NextResponse } from 'next/server';

// GET /api/insights/summary - Get financial summary for AI context
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check rate limit
  const rateLimitResult = checkRateLimit(userId, 'insights');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429, 
        headers: getRateLimitHeaders(rateLimitResult) 
      }
    );
  }

  try {
    const summary = await getFinancialSummary(userId);

    return NextResponse.json(summary, {
      headers: getRateLimitHeaders(rateLimitResult)
    });
  } catch (error) {
    console.error('Error fetching financial summary:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial summary' },
      { status: 500 }
    );
  }
}
