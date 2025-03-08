import { Pool,  PoolClient } from 'pg';
import { BaseEntity, BaseFilters, PaginationArgs, OrderByArgs } from '../types/base';

export interface QueryOptions {
  pagination?: PaginationArgs;
  orderBy?: OrderByArgs;
  filters?: BaseFilters;
}

export abstract class BaseService<T extends BaseEntity, CreateInput extends Record<string, any>, UpdateInput extends Partial<CreateInput>> {
  protected pool: Pool;
  protected tableName: string;

  constructor(pool: Pool, tableName: string) {
    this.pool = pool;
    this.tableName = tableName;
  }

  protected abstract mapFilters(filters: BaseFilters): Record<string, unknown>;

  protected async withClient<R>(callback: (client: PoolClient) => Promise<R>): Promise<R> {
    const client = await this.pool.connect();
    try {
      return await callback(client);
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<T | null> {
    return this.withClient(async (client) => {
      const result = await client.query<T>(
        `SELECT * FROM ${this.tableName} WHERE id = $1 AND hidden = false`,
        [id]
      );
      return result.rows[0] || null;
    });
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    return this.withClient(async (client) => {
      const { filters, pagination, orderBy } = options;
      const where: string[] = ['hidden = false'];
      const values: unknown[] = [];
      let orderByClause = 'ORDER BY created_at DESC';
      let limitClause = '';
      let offsetClause = '';

      // Handle filters
      if (filters) {
        const mappedFilters = this.mapFilters(filters);
        Object.entries(mappedFilters).forEach(([key, value], index) => {
          if (Array.isArray(value)) {
            where.push(`${key} = ANY($${index + 1})`);
            values.push(value);
          } else if (key.endsWith('_min')) {
            where.push(`${key.replace('_min', '')} >= $${index + 1}`);
            values.push(value);
          } else if (key.endsWith('_max')) {
            where.push(`${key.replace('_max', '')} <= $${index + 1}`);
            values.push(value);
          } else {
            where.push(`${key} ILIKE $${index + 1}`);
            values.push(`%${value}%`);
          }
        });
      }

      // Handle orderBy
      if (orderBy) {
        switch (orderBy) {
          case 'NAME_ASC':
            orderByClause = 'ORDER BY name ASC';
            break;
          case 'NAME_DESC':
            orderByClause = 'ORDER BY name DESC';
            break;
          case 'CREATED_AT_ASC':
            orderByClause = 'ORDER BY created_at ASC';
            break;
          case 'CREATED_AT_DESC':
            orderByClause = 'ORDER BY created_at DESC';
            break;
          case 'VISITS_DESC':
            orderByClause = 'ORDER BY (SELECT COUNT(*) FROM visits WHERE destination_id = destinations.id) DESC';
            break;
          case 'RATING_DESC':
            orderByClause = 'ORDER BY (SELECT AVG(rating) FROM visits WHERE destination_id = destinations.id) DESC';
            break;
          case 'POPULARITY':
            orderByClause = `
              ORDER BY 
                (SELECT COUNT(*) FROM visits WHERE destination_id = destinations.id) * 0.7 +
                COALESCE((SELECT AVG(rating) FROM visits WHERE destination_id = destinations.id), 0) * 0.3 
              DESC`;
            break;
        }
      }

      // Handle pagination
      if (pagination) {
        if (pagination.limit) {
          limitClause = `LIMIT ${pagination.limit}`;
        }
        if (pagination.offset) {
          offsetClause = `OFFSET ${pagination.offset}`;
        }
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const query = `
        SELECT * FROM ${this.tableName}
        ${whereClause}
        ${orderByClause}
        ${limitClause}
        ${offsetClause}
      `;

      const result = await client.query<T>(query, values);
      return result.rows;
    });
  }

  async create(input: CreateInput): Promise<T> {
    return this.withClient(async (client) => {
      const entries = Object.entries(input) as [string, any][];
      const columns = entries.map(([key]) => key);
      const values = entries.map(([_, value]) => value);
      const placeholders = values.map((_, i) => `$${i + 1}`);

      const result = await client.query<T>(
        `INSERT INTO ${this.tableName} (${columns.join(', ')})
         VALUES (${placeholders.join(', ')})
         RETURNING *`,
        values
      );
      return result.rows[0];
    });
  }

  async update(id: string, input: UpdateInput): Promise<T> {
    return this.withClient(async (client) => {
      const entries = Object.entries(input) as [string, any][];
      const setClause = entries
        .map(([key], index) => `${key} = $${index + 2}`)
        .join(', ');
      const values = entries.map(([_, value]) => value);

      const result = await client.query<T>(
        `UPDATE ${this.tableName}
         SET ${setClause}
         WHERE id = $1
         RETURNING *`,
        [id, ...values]
      );
      return result.rows[0];
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.withClient(async (client) => {
      const result = await client.query(
        `DELETE FROM ${this.tableName} WHERE id = $1`,
        [id]
      );
      return (result.rowCount ?? 0) > 0;
    });
  }
} 