import { getDb, schema } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import type { SavingGoal, NewSavingGoal, GoalContribution, NewGoalContribution } from '@/lib/db/schema';

export class SavingGoal {
  static async create(goalData: Omit<NewSavingGoal, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    const [goal] = await db.insert(schema.savingGoals)
      .values(goalData)
      .returning();
    
    return goal;
  }

  static async findByUserId(userId: string) {
    const db = getDb();
    const goals = await db.select()
      .from(schema.savingGoals)
      .where(eq(schema.savingGoals.userId, userId))
      .orderBy(desc(schema.savingGoals.createdAt));
    
    return goals;
  }

  static async findById(id: string) {
    const db = getDb();
    const [goal] = await db.select()
      .from(schema.savingGoals)
      .where(eq(schema.savingGoals.id, id))
      .limit(1);
    
    return goal || null;
  }

  static async findByStatus(userId: string, status: string) {
    const db = getDb();
    const goals = await db.select()
      .from(schema.savingGoals)
      .where(
        and(
          eq(schema.savingGoals.userId, userId),
          eq(schema.savingGoals.status, status)
        )
      )
      .orderBy(desc(schema.savingGoals.createdAt));
    
    return goals;
  }

  static async update(id: string, updates: Partial<Omit<SavingGoal, 'id' | 'createdAt' | 'updatedAt'>>) {
    const db = getDb();
    const [goal] = await db.update(schema.savingGoals)
      .set(updates)
      .where(eq(schema.savingGoals.id, id))
      .returning();
    
    return goal || null;
  }

  static async delete(id: string) {
    const db = getDb();
    const [goal] = await db.delete(schema.savingGoals)
      .where(eq(schema.savingGoals.id, id))
      .returning();
    
    return goal || null;
  }

  static async addContribution(goalId: string, amount: number, note?: string) {
    const db = getDb();
    
    // Add contribution
    const [contribution] = await db.insert(schema.goalContributions)
      .values({
        goalId,
        amount: String(amount),
        note: note || null,
      })
      .returning();
    
    // Update goal's current amount
    const goal = await this.findById(goalId);
    if (goal) {
      const newAmount = Number(goal.currentAmount) + amount;
      await this.update(goalId, { currentAmount: String(newAmount) });
    }
    
    return contribution;
  }

  static async getContributions(goalId: string) {
    const db = getDb();
    const contributions = await db.select()
      .from(schema.goalContributions)
      .where(eq(schema.goalContributions.goalId, goalId))
      .orderBy(desc(schema.goalContributions.date));
    
    return contributions;
  }

  static async getProgress(goalId: string) {
    const db = getDb();
    const goal = await this.findById(goalId);
    
    if (!goal) {
      return null;
    }
    
    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const percentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
    const remaining = targetAmount - currentAmount;
    
    return {
      goalId: goal.id,
      targetAmount,
      currentAmount,
      percentage,
      remaining,
      isCompleted: percentage >= 100,
    };
  }
}
