import { sql } from '@vercel/postgres';
import { hash } from 'bcrypt';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  bio?: string | null;
  avatar?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  bio?: string;
  avatar?: string;
}

export interface UpdateUserInput {
  name?: string;
  bio?: string;
  avatar?: string;
}

export const User = {
  async findOne(query: { email?: string; id?: string }): Promise<User | null> {
    const { email, id } = query;
    
    if (email) {
      const result = await sql<User>`
        SELECT * FROM users WHERE email = ${email} LIMIT 1
      `;
      return result.rows[0] || null;
    }
    
    if (id) {
      const result = await sql<User>`
        SELECT * FROM users WHERE id = ${id} LIMIT 1
      `;
      return result.rows[0] || null;
    }
    
    return null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await sql<User>`
      SELECT * FROM users WHERE id = ${id} LIMIT 1
    `;
    return result.rows[0] || null;
  },

  async create(input: CreateUserInput): Promise<User> {
    const hashedPassword = await hash(input.password, 12);
    
    const result = await sql<User>`
      INSERT INTO users (name, email, password, bio, avatar)
      VALUES (${input.name}, ${input.email}, ${hashedPassword}, ${input.bio || null}, ${input.avatar || null})
      RETURNING *
    `;
    
    return result.rows[0];
  },

  async findOneAndUpdate(query: { id?: string; email?: string }, updates: UpdateUserInput): Promise<User | null> {
    const { id, email } = query;
    const { name, bio, avatar } = updates;
    
    let result;
    
    if (id) {
      result = await sql<User>`
        UPDATE users
        SET 
          name = COALESCE(${name || null}, name),
          bio = COALESCE(${bio || null}, bio),
          avatar = COALESCE(${avatar || null}, avatar),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;
    } else if (email) {
      result = await sql<User>`
        UPDATE users
        SET 
          name = COALESCE(${name || null}, name),
          bio = COALESCE(${bio || null}, bio),
          avatar = COALESCE(${avatar || null}, avatar),
          updated_at = CURRENT_TIMESTAMP
        WHERE email = ${email}
        RETURNING *
      `;
    } else {
      return null;
    }
    
    return result.rows[0] || null;
  },

  async deleteOne(query: { id?: string; email?: string }): Promise<boolean> {
    const { id, email } = query;
    
    let result;
    
    if (id) {
      result = await sql`
        DELETE FROM users WHERE id = ${id}
      `;
    } else if (email) {
      result = await sql`
        DELETE FROM users WHERE email = ${email}
      `;
    } else {
      return false;
    }
    
    return (result.rowCount || 0) > 0;
  }
};

export default User;
