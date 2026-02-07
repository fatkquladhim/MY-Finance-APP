import { sql } from '@vercel/postgres';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens_used?: number | null;
  model?: string | null;
  finance_context?: boolean;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  status: 'active' | 'archived';
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateConversationInput {
  user_id: string;
  title?: string;
  status?: 'active' | 'archived';
}

export interface UpdateConversationInput {
  title?: string;
  status?: 'active' | 'archived';
  last_message_at?: Date;
}

export interface CreateMessageInput {
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used?: number;
  model?: string;
  finance_context?: boolean;
}

export const ChatConversation = {
  async find(query: { userId?: string; status?: string; limit?: number; skip?: number }): Promise<ChatConversation[]> {
    const { userId, status, limit, skip } = query;
    
    let queryText = 'SELECT * FROM chat_conversations WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;
    
    if (userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    queryText += ' ORDER BY last_message_at DESC';
    
    if (skip) {
      queryText += ` OFFSET ${skip}`;
    }
    
    if (limit) {
      queryText += ` LIMIT ${limit}`;
    }
    
    const result = await sql.query<ChatConversation>(queryText, params);
    return result.rows;
  },

  async findById(id: string): Promise<ChatConversation | null> {
    const result = await sql<ChatConversation>`
      SELECT * FROM chat_conversations WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async create(input: CreateConversationInput): Promise<ChatConversation> {
    const result = await sql<ChatConversation>`
      INSERT INTO chat_conversations (user_id, title, status)
      VALUES (${input.user_id}, ${input.title || 'New Conversation'}, ${input.status || 'active'})
      RETURNING *
    `;
    return result.rows[0];
  },

  async findOneAndUpdate(query: { id: string; userId: string }, updates: UpdateConversationInput): Promise<ChatConversation | null> {
    const { id, userId } = query;
    const { title, status, last_message_at } = updates;
    
    const lastMessageAtValue = last_message_at ? last_message_at.toISOString() : null;
    
    const result = await sql<ChatConversation>`
      UPDATE chat_conversations
      SET 
        title = COALESCE(${title || null}, title),
        status = COALESCE(${status || null}, status),
        last_message_at = COALESCE(${lastMessageAtValue}, last_message_at),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async findOneAndDelete(query: { id: string; userId: string }): Promise<ChatConversation | null> {
    const { id, userId } = query;
    
    const result = await sql<ChatConversation>`
      DELETE FROM chat_conversations WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async countDocuments(query: { userId?: string; status?: string }): Promise<number> {
    const { userId, status } = query;
    
    let queryText = 'SELECT COUNT(*) as count FROM chat_conversations WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;
    
    if (userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    const result = await sql.query<{ count: string }>(queryText, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  },

  // Message methods
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const result = await sql<ChatMessage>`
      SELECT * FROM chat_messages WHERE conversation_id = ${conversationId} ORDER BY timestamp ASC
    `;
    return result.rows;
  },

  async addMessage(input: CreateMessageInput): Promise<ChatMessage> {
    const result = await sql<ChatMessage>`
      INSERT INTO chat_messages (conversation_id, role, content, tokens_used, model, finance_context)
      VALUES (${input.conversation_id}, ${input.role}, ${input.content}, ${input.tokens_used || null}, ${input.model || null}, ${input.finance_context !== undefined ? input.finance_context : false})
      RETURNING *
    `;
    return result.rows[0];
  },

  async updateLastMessageAt(conversationId: string): Promise<ChatConversation | null> {
    const result = await sql<ChatConversation>`
      UPDATE chat_conversations
      SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${conversationId}
      RETURNING *
    `;
    return result.rows[0] || null;
  }
};

export default ChatConversation;
