import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import ChatConversation from '@/models/ChatConversation';
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

    const conversation = await ChatConversation.findById(id);

    if (!conversation || conversation.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await ChatConversation.getMessages(id);

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp?.toISOString() || new Date().toISOString()
      })),
      lastMessageAt: conversation.last_message_at?.toISOString(),
      createdAt: conversation.created_at?.toISOString()
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// PUT /api/chat/conversations/[id] - Update conversation (rename, archive)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, status } = body;

    const updateData: { title?: string; status?: 'active' | 'archived' } = {};
    if (title !== undefined) updateData.title = title;
    if (status !== undefined && ['active', 'archived'].includes(status)) {
      updateData.status = status as 'active' | 'archived';
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const conversation = await ChatConversation.findOneAndUpdate(
      { id, userId: session.user.id },
      updateData
    );

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      status: conversation.status,
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

    // Soft delete by archiving
    const result = await ChatConversation.findOneAndUpdate(
      { id, userId: session.user.id },
      { status: 'archived' }
    );

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
