import { Pool } from 'pg';
import { BaseService } from './base.service';
import { 
  Category,
  CategoryInput,
  CategoryUpdateInput,
  CategoryFilters
} from '../types/category';
import { BaseFilters } from '../types/base';

export class CategoryService extends BaseService<Category, CategoryInput, CategoryUpdateInput> {
  constructor(pool: Pool) {
    super(pool, 'destination_categories');
  }

  protected mapFilters(filters: BaseFilters): Record<string, any> {
    const typedFilters = filters as CategoryFilters;
    return {
      ...(typedFilters.search && { 
        name: typedFilters.search 
      }),
      ...(typedFilters.ids?.length && {
        id: typedFilters.ids
      })
    };
  }

  async search(term: string): Promise<Category[]> {
    const result = await this.pool.query<Category>(
      `SELECT * FROM destination_categories 
       WHERE name ILIKE $1
       ORDER BY name ASC`,
      [`%${term}%`]
    );
    return result.rows;
  }

  async getDestinations(categoryId: string) {
    const result = await this.pool.query(
      `SELECT d.* FROM destinations d
       WHERE d.category_id = $1`,
      [categoryId]
    );
    return result.rows;
  }

  async getStats(categoryId: string, period?: { period: string; count: number }) {
    let query = `
      SELECT 
        COUNT(DISTINCT d.id) as total_destinations,
        COUNT(DISTINCT v.id) as total_visits
      FROM destinations d
      LEFT JOIN visits v ON v.destination_id = d.id
      WHERE d.category_id = $1`;

    if (period) {
      query += ` AND v.visited_at >= NOW() - INTERVAL '${period.count} ${period.period}'`;
    }

    query += ` GROUP BY d.category_id`;

    const result = await this.pool.query(query, [categoryId]);
    
    return {
      total_destinations: parseInt(result.rows[0]?.total_destinations || '0', 10),
      total_visits: parseInt(result.rows[0]?.total_visits || '0', 10)
    };
  }
} 