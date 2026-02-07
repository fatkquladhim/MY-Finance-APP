import { sql } from '@vercel/postgres';

export interface Finance {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string | null;
  date: Date;
}

export interface CreateFinanceInput {
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date?: Date;
}

export interface UpdateFinanceInput {
  type?: 'income' | 'expense';
  amount?: number;
  category?: string;
  description?: string;
  date?: Date;
}

interface AggregationMatch {
  userId?: string;
  type?: 'income' | 'expense';
  category?: string;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

interface AggregationStage {
  $match?: AggregationMatch;
  $group?: {
    _id: null | string;
    total?: { $sum: string };
  };
}

interface AggregationResult {
  total?: number;
}

export const Finance = {
  async find(query: { userId?: string; type?: 'income' | 'expense'; category?: string; startDate?: Date; endDate?: Date }): Promise<Finance[]> {
    const { userId, type, category, startDate, endDate } = query;
    
    let queryText = 'SELECT * FROM finances WHERE 1=1';
    const params: (string | number | Date)[] = [];
    let paramIndex = 1;
    
    if (userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }
    
    if (category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (startDate) {
      queryText += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }
    
    if (endDate) {
      queryText += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }
    
    queryText += ' ORDER BY date DESC';
    
    const result = await sql.query<Finance>(queryText, params);
    return result.rows;
  },

  async findById(id: string): Promise<Finance | null> {
    const result = await sql<Finance>`
      SELECT * FROM finances WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async create(input: CreateFinanceInput): Promise<Finance> {
    const dateValue = input.date || new Date();
    const result = await sql<Finance>`
      INSERT INTO finances (user_id, type, amount, category, description, date)
      VALUES (${input.user_id}, ${input.type}, ${input.amount}, ${input.category}, ${input.description || null}, ${dateValue.toISOString()})
      RETURNING *
    `;
    return result.rows[0];
  },

  async findOneAndUpdate(query: { id: string; userId: string }, updates: UpdateFinanceInput): Promise<Finance | null> {
    const { id, userId } = query;
    const { type, amount, category, description, date } = updates;
    
    const dateValue = date ? date.toISOString() : null;
    
    const result = await sql<Finance>`
      UPDATE finances
      SET 
        type = COALESCE(${type || null}, type),
        amount = COALESCE(${amount || null}, amount),
        category = COALESCE(${category || null}, category),
        description = COALESCE(${description || null}, description),
        date = COALESCE(${dateValue}, date)
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async findOneAndDelete(query: { id: string; userId: string }): Promise<Finance | null> {
    const { id, userId } = query;
    
    const result = await sql<Finance>`
      DELETE FROM finances WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async aggregate(pipeline: AggregationStage[]): Promise<Finance[] | AggregationResult[]> {
    // MongoDB aggregation to SQL conversion
    // This is a simplified version for the specific use cases in the app
    
    for (const stage of pipeline) {
      if (stage.$match) {
        const match = stage.$match;
        let queryText = 'SELECT * FROM finances WHERE 1=1';
        const params: (string | number | Date)[] = [];
        let paramIndex = 1;
        
        if (match.userId) {
          queryText += ` AND user_id = $${paramIndex}`;
          params.push(match.userId);
          paramIndex++;
        }
        
        if (match.type) {
          queryText += ` AND type = $${paramIndex}`;
          params.push(match.type);
          paramIndex++;
        }
        
        if (match.category) {
          queryText += ` AND category = $${paramIndex}`;
          params.push(match.category);
          paramIndex++;
        }
        
        if (match.date) {
          if (match.date.$gte) {
            queryText += ` AND date >= $${paramIndex}`;
            params.push(match.date.$gte);
            paramIndex++;
          }
          if (match.date.$lte) {
            queryText += ` AND date <= $${paramIndex}`;
            params.push(match.date.$lte);
            paramIndex++;
          }
        }
        
        const result = await sql.query<Finance>(queryText, params);
        return result.rows;
      }
      
      if (stage.$group) {
        const group = stage.$group;
        
        if (group._id === null && group.total) {
          // Sum aggregation
          const matchStage = pipeline.find((p: AggregationStage) => p.$match);
          if (matchStage && matchStage.$match) {
            let queryText = 'SELECT SUM(amount) as total FROM finances WHERE 1=1';
            const params: (string | number | Date)[] = [];
            let paramIndex = 1;
            
            if (matchStage.$match.userId) {
              queryText += ` AND user_id = $${paramIndex}`;
              params.push(matchStage.$match.userId);
              paramIndex++;
            }
            
            if (matchStage.$match.type) {
              queryText += ` AND type = $${paramIndex}`;
              params.push(matchStage.$match.type);
              paramIndex++;
            }
            
            if (matchStage.$match.category) {
              queryText += ` AND category = $${paramIndex}`;
              params.push(matchStage.$match.category);
              paramIndex++;
            }
            
            if (matchStage.$match.date) {
              if (matchStage.$match.date.$gte) {
                queryText += ` AND date >= $${paramIndex}`;
                params.push(matchStage.$match.date.$gte);
                paramIndex++;
              }
              if (matchStage.$match.date.$lte) {
                queryText += ` AND date <= $${paramIndex}`;
                params.push(matchStage.$match.date.$lte);
                paramIndex++;
              }
            }
            
            const result = await sql.query<AggregationResult>(queryText, params);
            return [{ total: result.rows[0]?.total || 0 }];
          }
        }
      }
    }
    
    return [];
  }
};

export default Finance;
