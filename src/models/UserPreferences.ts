import { getDb, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import type { UserPreferences, NewUserPreferences } from '@/lib/db/schema';

export class UserPreferences {
  static async create(preferencesData: Omit<NewUserPreferences, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    const [preferences] = await db.insert(schema.userPreferences)
      .values(preferencesData)
      .returning();
    
    return preferences;
  }

  static async findByUserId(userId: string) {
    const db = getDb();
    const [preferences] = await db.select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, userId))
      .limit(1);
    
    return preferences || null;
  }

  static async findById(id: string) {
    const db = getDb();
    const [preferences] = await db.select()
      .from(schema.userPreferences)
      .where(eq(schema.userPreferences.id, id))
      .limit(1);
    
    return preferences || null;
  }

  static async update(userId: string, updates: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) {
    const db = getDb();
    
    // Check if preferences exist for this user
    const existing = await this.findByUserId(userId);
    
    if (existing) {
      // Update existing preferences
      const [preferences] = await db.update(schema.userPreferences)
        .set(updates)
        .where(eq(schema.userPreferences.userId, userId))
        .returning();
      
      return preferences || null;
    } else {
      // Create new preferences
      const [preferences] = await db.insert(schema.userPreferences)
        .values({
          userId,
          ...updates,
        } as NewUserPreferences)
        .returning();
      
      return preferences || null;
    }
  }

  static async delete(userId: string) {
    const db = getDb();
    const [preferences] = await db.delete(schema.userPreferences)
      .where(eq(schema.userPreferences.userId, userId))
      .returning();
    
    return preferences || null;
  }

  static async getOrCreate(userId: string) {
    const db = getDb();
    let preferences = await this.findByUserId(userId);
    
    if (!preferences) {
      [preferences] = await db.insert(schema.userPreferences)
        .values({ userId } as NewUserPreferences)
        .returning();
    }
    
    return preferences;
  }
}
