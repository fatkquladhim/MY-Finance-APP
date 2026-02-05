// Chat Types for AI Financial Assistant

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    financeContext?: boolean;
  };
}

export interface ChatConversation {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  status: 'active' | 'archived';
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  includeFinancialContext?: boolean;
}

export interface ChatResponse {
  conversationId: string;
  response: {
    role: 'assistant';
    content: string;
    timestamp: string;
  };
  metadata: {
    tokensUsed: number;
    financialContextIncluded: boolean;
  };
}

export interface ConversationListItem {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
