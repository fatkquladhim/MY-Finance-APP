import { getDb, schema } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import type { Budget, NewBudget } from '@/lib/db/schema';

export class Budget {
  static async create(budgetData: Omit<NewBudget, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    const [budget] = await db.insert(schema.budgets)
      .values(budgetData)
      .returning();
    
    return budget;
  }

  static async findByUserId(userId: string) {
    const db = getDb();
    const budgets = await db.select()
      .from(schema.budgets)
      .where(eq(schema.budgets.userId, userId))
      .orderBy(desc(schema.budgets.year), desc(schema.budgets.month));
    
    return budgets;
  }

  static async findById(id: string) {
    const db = getDb();
    const [budget] = await db.select()
      .from(schema.budgets)
      .where(eq(schema.budgets.id, id))
      .limit(1);
    
    return budget || null;
  }

  static async findByMonthYear(userId: string, month: string, year: string) {
    const db = getDb();
    const budgets = await db.select()
      .from(schema.budgets)
      .where(
        and(
          eq(schema.budgets.userId, userId),
          eq(schema.budgets.month, month),
          eq(schema.budgets.year, year)
        )
      );
    
    return budgets;
  }

  static async update(id: string, updates: Partial<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>) {
    const db = getDb();
    const [budget] = await db.update(schema.budgets)
      .set(updates)
      .where(eq(schema.budgets.id, id))
      .returning();
    
    return budget || null;
  }

  static async delete(id: string) {
    const db = getDb();
    const [budget] = await db.delete(schema.budgets)
      .where(eq(schema.budgets.id, id))
      .returning();
    
    return budget || null;
  }

  static async updateSpent(id: string, amount: number) {
    const db = getDb();
    const [budget] = await db.update(schema.budgets)
      .set({ spent: String(amount) })
      .where(eq(schema.budgets.id, id))
      .returning();
    
    return budget || null;
  }

  static async getBudgetSummary(userId: string, month: string, year: string) {
    const db = getDb();
    const budgets = await db.select()
      .from(schema.budgets)
      .where(
        and(
          eq(schema.budgets.userId, userId),
          eq(schema.budgets.month, month),
          eq(schema.budgets.year, year)
        )
      );
    
    return budgets.map(b => ({
      id: b.id,
      category: b.category,
      amount: Number(b.amount),
      spent: Number(b.spent),
      remaining: Number(b.amount) - Number(b.spent),
      percentage: Number(b.amount) > 0 ? (Number(b.spent) / Number(b.amount)) * 100 : 0,
    }));
  }
}
