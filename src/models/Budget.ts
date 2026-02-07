import { sql } from '@vercel/postgres';

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  period_month: number;
  period_year: number;
  alert_threshold: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateBudgetInput {
  user_id: string;
  category: string;
  monthly_limit: number;
  period_month: number;
  period_year: number;
  alert_threshold?: number;
  is_active?: boolean;
}

export interface UpdateBudgetInput {
  monthly_limit?: number;
  alert_threshold?: number;
  is_active?: boolean;
}

export const Budget = {
  async find(query: { userId?: string; category?: string; year?: number; month?: number; isActive?: boolean }): Promise<Budget[]> {
    const { userId, category, year, month, isActive } = query;
    
    let queryText = 'SELECT * FROM budgets WHERE 1=1';
    const params: (string | number | boolean)[] = [];
    let paramIndex = 1;
    
    if (userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (year) {
      queryText += ` AND period_year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }
    
    if (month) {
      queryText += ` AND period_month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }
    
    if (isActive !== undefined) {
      queryText += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    queryText += ' ORDER BY category ASC';
    
    const result = await sql.query<Budget>(queryText, params);
    return result.rows;
  },

  async findById(id: string): Promise<Budget | null> {
    const result = await sql<Budget>`
      SELECT * FROM budgets WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async create(input: CreateBudgetInput): Promise<Budget> {
    const result = await sql<Budget>`
      INSERT INTO budgets (user_id, category, monthly_limit, period_month, period_year, alert_threshold, is_active)
      VALUES (${input.user_id}, ${input.category}, ${input.monthly_limit}, ${input.period_month}, ${input.period_year}, ${input.alert_threshold || 80}, ${input.is_active !== undefined ? input.is_active : true})
      RETURNING *
    `;
    return result.rows[0];
  },

  async findOneAndUpdate(query: { id: string; userId: string }, updates: UpdateBudgetInput): Promise<Budget | null> {
    const { id, userId } = query;
    const { monthly_limit, alert_threshold, is_active } = updates;
    
    const result = await sql<Budget>`
      UPDATE budgets
      SET 
        monthly_limit = COALESCE(${monthly_limit || null}, monthly_limit),
        alert_threshold = COALESCE(${alert_threshold || null}, alert_threshold),
        is_active = COALESCE(${is_active !== undefined ? is_active : null}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async findOneAndDelete(query: { id: string; userId: string }): Promise<Budget | null> {
    const { id, userId } = query;
    
    const result = await sql<Budget>`
      DELETE FROM budgets WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async countDocuments(query: { userId?: string; category?: string; year?: number; month?: number; isActive?: boolean }): Promise<number> {
    const { userId, category, year, month, isActive } = query;
    
    let queryText = 'SELECT COUNT(*) as count FROM budgets WHERE 1=1';
    const params: (string | number | boolean)[] = [];
    let paramIndex = 1;
    
    if (userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (year) {
      queryText += ` AND period_year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }
    
    if (month) {
      queryText += ` AND period_month = $${paramIndex}`;
      params.push(month);
      paramIndex++;
    }
    
    if (isActive !== undefined) {
      queryText += ` AND is_active = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }
    
    const result = await sql.query<{ count: string }>(queryText, params);
    return parseInt(result.rows[0]?.count || '0', 10);
  }
};

export default Budget;
