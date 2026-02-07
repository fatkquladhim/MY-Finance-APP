import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ChatConversationModel } from '@/models/ChatConversation';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/chat/conversations/[id] - Get single conversation with full history
export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const conversation = await ChatConversationModel.findById(id);

    if (!conversation || conversation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await ChatConversationModel.getMessages(id);

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt?.toISOString() || new Date().toISOString()
      })),
      createdAt: conversation.createdAt?.toISOString()
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PUT /api/chat/conversations/[id] - Update conversation (rename)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await ChatConversationModel.findById(id);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const conversation = await ChatConversationModel.update(id, { title });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      message: 'Conversation updated'
    });
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat/conversations/[id] - Delete single conversation
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ownership
    const existing = await ChatConversationModel.findById(id);
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const result = await ChatConversationModel.delete(id);

    if (!result) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
