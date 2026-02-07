import { sql } from '@vercel/postgres';

export interface Portfolio {
  id: string;
  user_id: string;
  asset: string;
  type: 'stock' | 'crypto' | 'fund' | 'property';
  quantity: number;
  current_value: number;
  purchase_price?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePortfolioInput {
  user_id: string;
  asset: string;
  type: 'stock' | 'crypto' | 'fund' | 'property';
  quantity: number;
  current_value: number;
  purchase_price?: number;
}

export interface UpdatePortfolioInput {
  asset?: string;
  type?: 'stock' | 'crypto' | 'fund' | 'property';
  quantity?: number;
  current_value?: number;
  purchase_price?: number;
}

export const Portfolio = {
  async find(query: { userId?: string; type?: string; asset?: string }): Promise<Portfolio[]> {
    const { userId, type, asset } = query;
    
    let queryText = 'SELECT * FROM portfolio WHERE 1=1';
    const params: (string | number)[] = [];
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
    
    if (asset) {
      queryText += ` AND asset = $${paramIndex}`;
      params.push(asset);
      paramIndex++;
    }
    
    queryText += ' ORDER BY created_at DESC';
    
    const result = await sql.query<Portfolio>(queryText, params);
    return result.rows;
  },

  async findById(id: string): Promise<Portfolio | null> {
    const result = await sql<Portfolio>`
      SELECT * FROM portfolios WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async create(input: CreatePortfolioInput): Promise<Portfolio> {
    const result = await sql<Portfolio>`
      INSERT INTO portfolios (user_id, asset, type, quantity, current_value, purchase_price)
      VALUES (${input.user_id}, ${input.asset}, ${input.type}, ${input.quantity}, ${input.current_value}, ${input.purchase_price || null})
      RETURNING *
    `;
    return result.rows[0];
  },

  async findOneAndUpdate(query: { id: string; userId: string }, updates: UpdatePortfolioInput): Promise<Portfolio | null> {
    const { id, userId } = query;
    const { asset, type, quantity, current_value, purchase_price } = updates;
    
    const result = await sql<Portfolio>`
      UPDATE portfolios
      SET 
        asset = COALESCE(${asset || null}, asset),
        type = COALESCE(${type || null}, type),
        quantity = COALESCE(${quantity || null}, quantity),
        current_value = COALESCE(${current_value || null}, current_value),
        purchase_price = COALESCE(${purchase_price !== undefined ? purchase_price : null}, purchase_price),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async findOneAndDelete(query: { id: string; userId: string }): Promise<Portfolio | null> {
    const { id, userId } = query;
    
    const result = await sql<Portfolio>`
      DELETE FROM portfolios WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  }
};

export default Portfolio;
