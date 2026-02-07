import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ChatConversationModel } from '@/models/ChatConversation';
import { createChatCompletion, generateConversationTitle } from '@/lib/openrouter';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatRequest } from '@/types/chat';
import type { ChatCompletionMessage } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check rate limit
  const rateLimitResult = checkRateLimit(userId, 'chat');
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
    const body: ChatRequest = await req.json();
    const { message, conversationId, includeFinancialContext = true } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let conversation;
    let isNewConversation = false;

    if (conversationId) {
      // Find existing conversation
      conversation = await ChatConversationModel.findById(conversationId);

      if (!conversation || conversation.userId !== userId) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      // Create new conversation
      isNewConversation = true;
      conversation = await ChatConversationModel.create({
        userId,
        title: 'New Conversation'
      });
    }

    // Add user message to conversation
    await ChatConversationModel.addMessage(conversation.id, 'user', message.trim());

    // Get messages for AI context (last 10 messages)
    const messages = await ChatConversationModel.getMessages(conversation.id);
    const recentMessages: ChatCompletionMessage[] = messages
      .slice(-10)
      .map((m) => ({
        role: (m.role === 'system' ? 'user' : m.role) as 'user' | 'assistant' | 'system',
        content: m.content,
      }));

    // Get AI response
    const aiResult = await createChatCompletion({
      messages: recentMessages,
      userId,
      includeFinancialContext
    });

    // Add assistant response to conversation
    await ChatConversationModel.addMessage(conversation.id, 'assistant', aiResult.content);

    // Generate title for new conversations
    if (isNewConversation) {
      const title = await generateConversationTitle(message);
      await ChatConversationModel.update(conversation.id, { title });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      response: {
        role: 'assistant',
        content: aiResult.content,
        timestamp: new Date().toISOString()
      },
      metadata: {
        tokensUsed: aiResult.tokensUsed,
        financialContextIncluded: includeFinancialContext
      }
    }, {
      headers: getRateLimitHeaders(rateLimitResult)
    });
  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
