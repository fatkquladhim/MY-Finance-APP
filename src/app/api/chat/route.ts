import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import ChatConversation from '@/models/ChatConversation';
import { createChatCompletion, generateConversationTitle } from '@/lib/openrouter';
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatRequest } from '@/types/chat';

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

    await connectToDatabase();

    let conversation;
    let isNewConversation = false;

    if (conversationId) {
      // Find existing conversation
      conversation = await ChatConversation.findOne({
        _id: conversationId,
        userId
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      // Create new conversation
      isNewConversation = true;
      conversation = new ChatConversation({
        userId,
        title: 'New Conversation',
        messages: [],
        status: 'active'
      });
    }

    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    });

    // Build messages for OpenAI (last 10 messages for context)
    const recentMessages = conversation.messages
    .slice(-10)
    .map((m: unknown) => {
      if (
        typeof m === 'object' &&
        m !== null &&
        'role' in m &&
        'content' in m
      ) {
        const msg = m as {
          role: 'user' | 'assistant' | 'system';
          content: string;
        };

        return {
          role: msg.role === 'system' ? 'user' : msg.role,
          content: msg.content,
        };
      }

      throw new Error('Invalid message format');
    });


    // Get AI response
    const aiResult = await createChatCompletion({
      messages: recentMessages,
      userId,
      includeFinancialContext
    });

    // Add assistant response to conversation
    const assistantMessage = {
      role: 'assistant' as const,
      content: aiResult.content,
      timestamp: new Date(),
      metadata: {
        tokensUsed: aiResult.tokensUsed,
        model: aiResult.model,
        financeContext: includeFinancialContext
      }
    };
    conversation.messages.push(assistantMessage);

    // Generate title for new conversations
    if (isNewConversation) {
      conversation.title = await generateConversationTitle(message);
    }

    // Update last message timestamp
    conversation.lastMessageAt = new Date();

    // Save conversation
    await conversation.save();

    return NextResponse.json({
      conversationId: conversation._id.toString(),
      response: {
        role: 'assistant',
        content: aiResult.content,
        timestamp: assistantMessage.timestamp.toISOString()
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
