import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ChatConversation from '@/models/ChatConversation';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat/conversations - List all conversations
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'active';

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      ChatConversation.find({
        userId: session.user.id,
        status: status as 'active' | 'archived',
        limit,
        skip
      }),
      ChatConversation.countDocuments({
        userId: session.user.id,
        status: status as 'active' | 'archived'
      })
    ]);

    const formattedConversations = conversations.map((conv) => {
      return {
        id: conv.id,
        title: conv.title,
        lastMessage: '',
        lastMessageAt: conv.last_message_at?.toISOString() || '',
        messageCount: 0
      };
    });

    return NextResponse.json({
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/conversations - Delete all conversations (optional bulk delete)
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Archive all conversations instead of hard delete
    const conversations = await ChatConversation.find({
      userId: session.user.id,
      status: 'active'
    });

    for (const conv of conversations) {
      await ChatConversation.findOneAndUpdate(
        { id: conv.id, userId: session.user.id },
        { status: 'archived' }
      );
    }

    return NextResponse.json({ message: 'All conversations archived' });
  } catch (error) {
    console.error('Error archiving conversations:', error);
    return NextResponse.json(
      { error: 'Failed to archive conversations' },
      { status: 500 }
    );
  }
}
