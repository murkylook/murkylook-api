import { Pool } from 'pg';
import { User } from '../types/user';

export class UserService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<User[]> {
    const query = `
      SELECT *
      FROM users
      WHERE hidden = false
      ORDER BY username ASC
    `;
    
    const result = await this.pool.query<User>(query);
    return result.rows;
  }

  async getById(id: number): Promise<User | null> {
    const query = `
      SELECT *
      FROM users
      WHERE id = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  async getByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT *
      FROM users
      WHERE username = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<User>(query, [username]);
    return result.rows[0] || null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT *
      FROM users
      WHERE email = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<User>(query, [email]);
    return result.rows[0] || null;
  }
} 