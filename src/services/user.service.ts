import { Pool } from 'pg';
import { BaseService } from './base.service';
import { BaseFilters } from '../types/base';

interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

interface UserInput {
  email: string;
  name: string;
  avatar_url?: string;
}

interface UserUpdateInput extends Partial<UserInput> {}

interface UserFilters extends BaseFilters {
  email?: string;
}

export class UserService extends BaseService<User, UserInput, UserUpdateInput> {
  constructor(pool: Pool) {
    super(pool, 'users');
  }

  protected mapFilters(filters: BaseFilters): Record<string, any> {
    const typedFilters = filters as UserFilters;
    return {
      ...(typedFilters.search && { 
        name: typedFilters.search 
      }),
      ...(typedFilters.email && {
        email: typedFilters.email
      }),
      ...(typedFilters.ids?.length && {
        id: typedFilters.ids
      })
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async getStats(id: string): Promise<{ total_visits: number; total_countries: number }> {
    const result = await this.pool.query<{ total_visits: string; total_countries: string }>(
      `SELECT 
        COUNT(DISTINCT v.id) as total_visits,
        COUNT(DISTINCT c.id) as total_countries
       FROM users u
       LEFT JOIN visits v ON v.user_id = u.id
       LEFT JOIN destinations d ON d.id = v.destination_id
       LEFT JOIN countries c ON c.id = d.country_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );
    
    return {
      total_visits: parseInt(result.rows[0]?.total_visits || '0', 10),
      total_countries: parseInt(result.rows[0]?.total_countries || '0', 10)
    };
  }

  async getRecentVisits(id: string, limit: number = 5): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT v.*, d.name as destination_name
       FROM visits v
       JOIN destinations d ON d.id = v.destination_id
       WHERE v.user_id = $1
       ORDER BY v.visited_at DESC
       LIMIT $2`,
      [id, limit]
    );
    return result.rows;
  }

  async getTopCountries(id: string, limit: number = 5): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        c.*,
        COUNT(v.id) as visit_count
       FROM countries c
       JOIN destinations d ON d.country_id = c.id
       JOIN visits v ON v.destination_id = d.id
       WHERE v.user_id = $1
       GROUP BY c.id
       ORDER BY visit_count DESC
       LIMIT $2`,
      [id, limit]
    );
    return result.rows;
  }
} 