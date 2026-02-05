import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import ChatConversation from '@/models/ChatConversation';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat/conversations - List all conversations
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') || 'active';

    const skip = (page - 1) * limit;

    const query = {
      userId: session.user.id,
      status
    };

    const [conversations, total] = await Promise.all([
      ChatConversation.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title messages lastMessageAt status')
        .lean(),
      ChatConversation.countDocuments(query)
    ]);

    const formattedConversations = conversations.map((conv: any) => {
      const lastMessage = conv.messages[conv.messages.length - 1];
      return {
        id: conv._id.toString(),
        title: conv.title,
        lastMessage: lastMessage?.content?.substring(0, 100) || '',
        lastMessageAt: conv.lastMessageAt?.toISOString() || '',
        messageCount: conv.messages?.length || 0
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
    await connectToDatabase();

    // Archive all conversations instead of hard delete
    await ChatConversation.updateMany(
      { userId: session.user.id, status: 'active' },
      { status: 'archived' }
    );

    return NextResponse.json({ message: 'All conversations archived' });
  } catch (error) {
    console.error('Error archiving conversations:', error);
    return NextResponse.json(
      { error: 'Failed to archive conversations' },
      { status: 500 }
    );
  }
}
