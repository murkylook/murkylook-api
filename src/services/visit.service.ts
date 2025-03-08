import { Pool } from 'pg';
import { BaseService } from './base.service';
import { BaseFilters } from '../types/base';

interface Visit {
  id: string;
  user_id: string;
  destination_id: string;
  visited_at: Date;
  rating?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface VisitInput {
  user_id: string;
  destination_id: string;
  visited_at: Date;
  rating?: number;
  notes?: string;
}

interface VisitUpdateInput extends Partial<VisitInput> {}

interface VisitFilters extends BaseFilters {
  user_id?: string;
  destination_id?: string;
  from_date?: Date;
  to_date?: Date;
}

export class VisitService extends BaseService<Visit, VisitInput, VisitUpdateInput> {
  constructor(pool: Pool) {
    super(pool, 'visits');
  }

  protected mapFilters(filters: BaseFilters): Record<string, any> {
    const typedFilters = filters as VisitFilters;
    return {
      ...(typedFilters.user_id && {
        user_id: typedFilters.user_id
      }),
      ...(typedFilters.destination_id && {
        destination_id: typedFilters.destination_id
      }),
      ...(typedFilters.from_date && {
        from_date: typedFilters.from_date
      }),
      ...(typedFilters.to_date && {
        to_date: typedFilters.to_date
      }),
      ...(typedFilters.ids?.length && {
        id: typedFilters.ids
      })
    };
  }

  async findByUser(userId: string): Promise<Visit[]> {
    const result = await this.pool.query<Visit>(
      `SELECT * FROM visits 
       WHERE user_id = $1 
       ORDER BY visited_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async findByDestination(destinationId: string): Promise<Visit[]> {
    const result = await this.pool.query<Visit>(
      `SELECT * FROM visits 
       WHERE destination_id = $1 
       ORDER BY visited_at DESC`,
      [destinationId]
    );
    return result.rows;
  }

  async getStats(id: string): Promise<{ average_rating: number }> {
    const result = await this.pool.query<{ average_rating: number }>(
      `SELECT AVG(rating) as average_rating 
       FROM visits 
       WHERE id = $1`,
      [id]
    );
    
    return {
      average_rating: result.rows[0].average_rating || 0
    };
  }
} 