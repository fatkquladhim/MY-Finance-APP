import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ChatConversationModel } from '@/models/ChatConversation';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/chat/conversations - List all conversations
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const conversations = await ChatConversationModel.findByUserId(session.user.id);

    const formattedConversations = await Promise.all(conversations.map(async (conv) => {
      const messages = await ChatConversationModel.getMessages(conv.id);
      const lastMessage = messages[messages.length - 1];
      
      return {
        id: conv.id,
        title: conv.title,
        lastMessage: lastMessage?.content || '',
        lastMessageAt: lastMessage?.createdAt?.toISOString() || conv.updatedAt.toISOString(),
        messageCount: messages.length
      };
    }));

    return NextResponse.json({
      conversations: formattedConversations,
      pagination: {
        page: 1,
        limit: formattedConversations.length,
        total: formattedConversations.length,
        totalPages: 1
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

// POST /api/chat/conversations - Create a new conversation
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const conversation = await ChatConversationModel.create({
      userId: session.user.id,
      title
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
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
    const conversations = await ChatConversationModel.findByUserId(session.user.id);

    for (const conv of conversations) {
      await ChatConversationModel.delete(conv.id);
    }

    return NextResponse.json({ message: 'All conversations deleted' });
  } catch (error) {
    console.error('Error deleting conversations:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversations' },
      { status: 500 }
    );
  }
}
