import { getDb, schema } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import type { Portfolio, NewPortfolio } from '@/lib/db/schema';

export class Portfolio {
  static async create(portfolioData: Omit<NewPortfolio, 'id' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    const [portfolio] = await db.insert(schema.portfolio)
      .values(portfolioData)
      .returning();
    
    return portfolio;
  }

  static async findByUserId(userId: string) {
    const db = getDb();
    const portfolios = await db.select()
      .from(schema.portfolio)
      .where(eq(schema.portfolio.userId, userId))
      .orderBy(desc(schema.portfolio.purchaseDate));
    
    return portfolios;
  }

  static async findById(id: string) {
    const db = getDb();
    const [portfolio] = await db.select()
      .from(schema.portfolio)
      .where(eq(schema.portfolio.id, id))
      .limit(1);
    
    return portfolio || null;
  }

  static async findByType(userId: string, type: string) {
    const db = getDb();
    const portfolios = await db.select()
      .from(schema.portfolio)
      .where(
        and(
          eq(schema.portfolio.userId, userId),
          eq(schema.portfolio.type, type)
        )
      )
      .orderBy(desc(schema.portfolio.purchaseDate));
    
    return portfolios;
  }

  static async update(id: string, updates: Partial<Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>>) {
    const db = getDb();
    const [portfolio] = await db.update(schema.portfolio)
      .set(updates)
      .where(eq(schema.portfolio.id, id))
      .returning();
    
    return portfolio || null;
  }

  static async delete(id: string) {
    const db = getDb();
    const [portfolio] = await db.delete(schema.portfolio)
      .where(eq(schema.portfolio.id, id))
      .returning();
    
    return portfolio || null;
  }

  static async updatePrices(id: string, currentPrice: number) {
    const db = getDb();
    const portfolio = await this.findById(id);
    
    if (!portfolio) {
      return null;
    }
    
    const quantity = Number(portfolio.quantity);
    const totalValue = quantity * currentPrice;
    
    const [updated] = await db.update(schema.portfolio)
      .set({
        currentPrice: String(currentPrice),
        totalValue: String(totalValue),
      })
      .where(eq(schema.portfolio.id, id))
      .returning();
    
    return updated || null;
  }

  static async getSummary(userId: string) {
    const db = getDb();
    const portfolios = await this.findByUserId(userId);
    
    const summary = {
      totalValue: 0,
      totalInvested: 0,
      totalProfit: 0,
      totalProfitPercentage: 0,
      byType: {} as Record<string, { count: number; totalValue: number; totalInvested: number }>,
    };
    
    for (const p of portfolios) {
      const totalValue = Number(p.totalValue);
      const invested = Number(p.averagePrice) * Number(p.quantity);
      const profit = totalValue - invested;
      
      summary.totalValue += totalValue;
      summary.totalInvested += invested;
      summary.totalProfit += profit;
      
      const type = p.type;
      if (!summary.byType[type]) {
        summary.byType[type] = { count: 0, totalValue: 0, totalInvested: 0 };
      }
      summary.byType[type].count++;
      summary.byType[type].totalValue += totalValue;
      summary.byType[type].totalInvested += invested;
    }
    
    summary.totalProfitPercentage = summary.totalInvested > 0 
      ? (summary.totalProfit / summary.totalInvested) * 100 
      : 0;
    
    return summary;
  }
}
