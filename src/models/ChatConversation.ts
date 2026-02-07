import { getDb, schema } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import type { ChatConversation, NewChatConversation } from '@/lib/db/schema';

export class ChatConversationModel {
  static async create(conversationData: Omit<NewChatConversation, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    const [conversation] = await db.insert(schema.chatConversations)
      .values(conversationData)
      .returning();
    
    return conversation;
  }

  static async findByUserId(userId: string) {
    const db = getDb();
    const conversations = await db.select()
      .from(schema.chatConversations)
      .where(eq(schema.chatConversations.userId, userId))
      .orderBy(desc(schema.chatConversations.updatedAt));
    
    return conversations;
  }

  static async findById(id: string) {
    const db = getDb();
    const [conversation] = await db.select()
      .from(schema.chatConversations)
      .where(eq(schema.chatConversations.id, id))
      .limit(1);
    
    return conversation || null;
  }

  static async update(id: string, updates: Partial<Omit<ChatConversation, 'id' | 'createdAt' | 'updatedAt'>>) {
    const db = getDb();
    
    // If no updates provided, just update the timestamp
    const updateData = Object.keys(updates).length === 0 
      ? { updatedAt: new Date() } 
      : updates;
    
    const [conversation] = await db.update(schema.chatConversations)
      .set(updateData)
      .where(eq(schema.chatConversations.id, id))
      .returning();
    
    return conversation || null;
  }

  static async delete(id: string) {
    const db = getDb();
    const [conversation] = await db.delete(schema.chatConversations)
      .where(eq(schema.chatConversations.id, id))
      .returning();
    
    return conversation || null;
  }

  static async addMessage(conversationId: string, role: 'user' | 'assistant', content: string) {
    const db = getDb();
    
    // Add message
    const [message] = await db.insert(schema.chatMessages)
      .values({
        conversationId,
        role,
        content,
      })
      .returning();
    
    // Update conversation's updatedAt timestamp
    await this.update(conversationId, {});
    
    return message;
  }

  static async getMessages(conversationId: string) {
    const db = getDb();
    const messages = await db.select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.conversationId, conversationId))
      .orderBy(schema.chatMessages.createdAt);
    
    return messages;
  }

  static async getConversationWithMessages(id: string) {
    const conversation = await this.findById(id);
    
    if (!conversation) {
      return null;
    }
    
    const messages = await this.getMessages(id);
    
    return {
      ...conversation,
      messages,
    };
  }
}
