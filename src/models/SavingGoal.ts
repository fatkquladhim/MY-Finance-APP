import { sql } from '@vercel/postgres';

export interface GoalContribution {
  id: string;
  goal_id: string;
  amount: number;
  date: Date;
  note?: string | null;
}

export interface SavingGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: Date | null;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'abandoned';
  created_at: Date;
  updated_at: Date;
}

export interface CreateSavingGoalInput {
  user_id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline?: Date;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'abandoned';
}

export interface UpdateSavingGoalInput {
  name?: string;
  target_amount?: number;
  current_amount?: number;
  deadline?: Date;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'abandoned';
}

export interface CreateContributionInput {
  goal_id: string;
  amount: number;
  note?: string;
}

export const SavingGoal = {
  async find(query: { userId?: string; status?: string; priority?: string }): Promise<SavingGoal[]> {
    const { userId, status, priority } = query;
    
    let queryText = 'SELECT * FROM saving_goals WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;
    
    if (userId) {
      queryText += ` AND user_id = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }
    
    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (priority) {
      queryText += ` AND priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }
    
    queryText += ' ORDER BY priority DESC, created_at DESC';
    
    const result = await sql.query<SavingGoal>(queryText, params);
    return result.rows;
  },

  async findById(id: string): Promise<SavingGoal | null> {
    const result = await sql<SavingGoal>`
      SELECT * FROM saving_goals WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async create(input: CreateSavingGoalInput): Promise<SavingGoal> {
    const result = await sql<SavingGoal>`
      INSERT INTO saving_goals (user_id, name, target_amount, current_amount, deadline, priority, status)
      VALUES (${input.user_id}, ${input.name}, ${input.target_amount}, ${input.current_amount || 0}, ${input.deadline ? input.deadline.toISOString() : null}, ${input.priority || 'medium'}, ${input.status || 'active'})
      RETURNING *
    `;
    return result.rows[0];
  },

  async findOneAndUpdate(query: { id: string; userId: string }, updates: UpdateSavingGoalInput): Promise<SavingGoal | null> {
    const { id, userId } = query;
    const { name, target_amount, current_amount, deadline, priority, status } = updates;
    
    const deadlineValue = deadline ? deadline.toISOString() : null;
    
    const result = await sql<SavingGoal>`
      UPDATE saving_goals
      SET 
        name = COALESCE(${name || null}, name),
        target_amount = COALESCE(${target_amount || null}, target_amount),
        current_amount = COALESCE(${current_amount || null}, current_amount),
        deadline = COALESCE(${deadlineValue}, deadline),
        priority = COALESCE(${priority || null}, priority),
        status = COALESCE(${status || null}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  async findOneAndDelete(query: { id: string; userId: string }): Promise<SavingGoal | null> {
    const { id, userId } = query;
    
    const result = await sql<SavingGoal>`
      DELETE FROM saving_goals WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    return result.rows[0] || null;
  },

  // Contribution methods
  async addContribution(input: CreateContributionInput): Promise<GoalContribution> {
    const result = await sql<GoalContribution>`
      INSERT INTO goal_contributions (goal_id, amount, note)
      VALUES (${input.goal_id}, ${input.amount}, ${input.note || null})
      RETURNING *
    `;
    return result.rows[0];
  },

  async getContributions(goalId: string): Promise<GoalContribution[]> {
    const result = await sql<GoalContribution>`
      SELECT * FROM goal_contributions WHERE goal_id = ${goalId} ORDER BY date ASC
    `;
    return result.rows;
  },

  async updateCurrentAmount(goalId: string, amount: number): Promise<SavingGoal | null> {
    const result = await sql<SavingGoal>`
      UPDATE saving_goals
      SET current_amount = ${amount}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${goalId}
      RETURNING *
    `;
    return result.rows[0] || null;
  }
};

export default SavingGoal;
