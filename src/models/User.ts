import { getDb, schema } from '@/lib/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User, NewUser } from '@/lib/db/schema';

export class User {
  static async create(userData: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db.insert(schema.users)
      .values({
        ...userData,
        password: hashedPassword,
      })
      .returning();
    
    return user;
  }

  static async findByEmail(email: string) {
    const db = getDb();
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    
    return user || null;
  }

  static async findById(id: string) {
    const db = getDb();
    const [user] = await db.select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    
    return user || null;
  }

  static async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) {
    const db = getDb();
    
    // If password is being updated, hash it
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [user] = await db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, id))
      .returning();
    
    return user || null;
  }

  static async delete(id: string) {
    const db = getDb();
    const [user] = await db.delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();
    
    return user || null;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
