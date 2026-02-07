import { getDb, schema } from '@/lib/db';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import type { finances, NewFinance } from '@/lib/db/schema';

export class Finance {
  static async create(financeData: Omit<NewFinance, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    const [finance] = await db.insert(schema.finances)
      .values(financeData)
      .returning();
    
    return finance;
  }

  static async findByUserId(userId: string) {
    const db = getDb();
    const finances = await db.select()
      .from(schema.finances)
      .where(eq(schema.finances.userId, userId))
      .orderBy(desc(schema.finances.date));
    
    return finances;
  }

  static async findById(id: string) {
    const db = getDb();
    const [finance] = await db.select()
      .from(schema.finances)
      .where(eq(schema.finances.id, id))
      .limit(1);
    
    return finance || null;
  }

  static async findByDateRange(userId: string, startDate: Date, endDate: Date) {
    const db = getDb();
    const finances = await db.select()
      .from(schema.finances)
      .where(
        and(
          eq(schema.finances.userId, userId),
          gte(schema.finances.date, startDate),
          lte(schema.finances.date, endDate)
        )
      )
      .orderBy(desc(schema.finances.date));
    
    return finances;
  }

  static async update(id: string, updates: Partial<Omit<Finance, 'id' | 'createdAt' | 'updatedAt'>>) {
    const db = getDb();
    const [finance] = await db.update(schema.finances)
      .set(updates)
      .where(eq(schema.finances.id, id))
      .returning();
    
    return finance || null;
  }

  static async delete(id: string) {
    const db = getDb();
    const [finance] = await db.delete(schema.finances)
      .where(eq(schema.finances.id, id))
      .returning();
    
    return finance || null;
  }

  static async getSummaryByCategory(userId: string, type: 'income' | 'expense', startDate?: Date, endDate?: Date) {
    const db = getDb();
    
    const conditions = [eq(schema.finances.userId, userId), eq(schema.finances.type, type)];
    
    if (startDate && endDate) {
      conditions.push(gte(schema.finances.date, startDate));
      conditions.push(lte(schema.finances.date, endDate));
    }
    
    const result = await db.select({
      category: schema.finances.category,
      total: sql<number>`COALESCE(SUM(${schema.finances.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
      .from(schema.finances)
      .where(and(...conditions))
      .groupBy(schema.finances.category);
    
    return result;
  }

  static async getMonthlySummary(userId: string, year: number, month: number) {
    const db = getDb();
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const result = await db.select({
      type: schema.finances.type,
      total: sql<number>`COALESCE(SUM(${schema.finances.amount}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
      .from(schema.finances)
      .where(
        and(
          eq(schema.finances.userId, userId),
          gte(schema.finances.date, startDate),
          lte(schema.finances.date, endDate)
        )
      )
      .groupBy(schema.finances.type);
    
    return result;
  }

  static async getTotalByType(userId: string, type: 'income' | 'expense', startDate?: Date, endDate?: Date) {
    const db = getDb();
    
    const conditions = [eq(schema.finances.userId, userId), eq(schema.finances.type, type)];
    
    if (startDate && endDate) {
      conditions.push(gte(schema.finances.date, startDate));
      conditions.push(lte(schema.finances.date, endDate));
    }
    
    const [result] = await db.select({
      total: sql<number>`COALESCE(SUM(${schema.finances.amount}), 0)`,
    })
      .from(schema.finances)
      .where(and(...conditions));
    
    return result?.total || 0;
  }
}
