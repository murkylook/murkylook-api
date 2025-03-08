import { Pool } from 'pg';
import { BaseService } from './base.service';
import { 
  Destination,
  DestinationInput,
  DestinationUpdateInput,
  DestinationFilters 
} from '../types/destination';
import { BaseFilters } from '../types/base';

export class DestinationService extends BaseService<Destination, DestinationInput, DestinationUpdateInput> {
  constructor(pool: Pool) {
    super(pool, 'destinations');
  }

  protected mapFilters(filters: BaseFilters): Record<string, any> {
    const typedFilters = filters as DestinationFilters;
    const conditions: Record<string, any> = {
      ...(typedFilters.search && { 
        name: typedFilters.search 
      }),
      ...(typedFilters.country_id && {
        country_id: typedFilters.country_id
      }),
      ...(typedFilters.ids?.length && {
        id: typedFilters.ids
      })
    };

    // Handle geographic bounds if provided
    if (typedFilters.latitude_min !== undefined) {
      conditions.latitude_min = typedFilters.latitude_min;
    }
    if (typedFilters.latitude_max !== undefined) {
      conditions.latitude_max = typedFilters.latitude_max;
    }
    if (typedFilters.longitude_min !== undefined) {
      conditions.longitude_min = typedFilters.longitude_min;
    }
    if (typedFilters.longitude_max !== undefined) {
      conditions.longitude_max = typedFilters.longitude_max;
    }

    return conditions;
  }

  async findByCountry(countryId: string): Promise<Destination[]> {
    const result = await this.pool.query<Destination>(
      `SELECT * FROM destinations 
       WHERE country_id = $1 AND hidden = false
       ORDER BY name ASC`,
      [countryId]
    );
    return result.rows;
  }

  async findByContinent(continentId: string): Promise<Destination[]> {
    const result = await this.pool.query<Destination>(
      `SELECT d.* 
       FROM destinations d
       JOIN countries c ON c.id = d.country_id
       WHERE c.continent_id = $1 
       AND d.hidden = false 
       AND c.hidden = false
       ORDER BY d.name ASC`,
      [continentId]
    );
    return result.rows;
  }

  async search(term: string): Promise<Destination[]> {
    const result = await this.pool.query<Destination>(
      `SELECT d.* 
       FROM destinations d
       JOIN countries c ON c.id = d.country_id
       WHERE (d.name ILIKE $1 OR c.name ILIKE $1)
       AND d.hidden = false
       AND c.hidden = false
       ORDER BY d.name ASC`,
      [`%${term}%`]
    );
    return result.rows;
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number): Promise<Destination[]> {
    // Using the Haversine formula to calculate distances
    const result = await this.pool.query<Destination>(
      `SELECT d.*, 
        (6371 * acos(
          cos(radians($1)) * 
          cos(radians(d.latitude)) * 
          cos(radians(d.longitude) - radians($2)) + 
          sin(radians($1)) * 
          sin(radians(d.latitude))
        )) AS distance
       FROM destinations d
       JOIN countries c ON c.id = d.country_id
       WHERE d.hidden = false AND c.hidden = false
       HAVING (6371 * acos(
          cos(radians($1)) * 
          cos(radians(d.latitude)) * 
          cos(radians(d.longitude) - radians($2)) + 
          sin(radians($1)) * 
          sin(radians(d.latitude))
        )) < $3
       ORDER BY distance`,
      [latitude, longitude, radiusKm]
    );
    return result.rows;
  }

  async updateCategories(id: string, categoryIds: string[]): Promise<void> {
    // First, remove existing categories
    await this.pool.query(
      'DELETE FROM destination_categories WHERE destination_id = $1',
      [id]
    );

    if (categoryIds.length > 0) {
      // Then, insert new categories
      const values = categoryIds.map((_, i) => `($1, $${i + 2})`).join(',');
      await this.pool.query(
        `INSERT INTO destination_categories (destination_id, category_id) 
         VALUES ${values}`,
        [id, ...categoryIds]
      );
    }
  }

  override async create(input: DestinationInput): Promise<Destination> {
    const { category_ids, ...destinationData } = input;
    
    // Start a transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Create the destination
      const destination = await super.create(destinationData);

      // Add categories if provided
      if (category_ids?.length) {
        const values = category_ids.map((_, i) => `($1, $${i + 2})`).join(',');
        await client.query(
          `INSERT INTO destination_categories (destination_id, category_id) 
           VALUES ${values}`,
          [destination.id, ...category_ids]
        );
      }

      await client.query('COMMIT');
      return destination;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  override async update(id: string, input: DestinationUpdateInput): Promise<Destination> {
    const { category_ids, ...destinationData } = input;
    
    // Start a transaction
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Update the destination
      const destination = await super.update(id, destinationData);

      // Update categories if provided
      if (category_ids !== undefined) {
        await client.query(
          'DELETE FROM destination_categories WHERE destination_id = $1',
          [id]
        );

        if (category_ids.length > 0) {
          const values = category_ids.map((_, i) => `($1, $${i + 2})`).join(',');
          await client.query(
            `INSERT INTO destination_categories (destination_id, category_id) 
             VALUES ${values}`,
            [id, ...category_ids]
          );
        }
      }

      await client.query('COMMIT');
      return destination;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getStats(id: string): Promise<{ 
    total_visits: number; 
    average_rating: number; 
    visitsByPeriod: any[] 
  }> {
    const result = await this.pool.query(`
      WITH visit_periods AS (
        SELECT 
          date_trunc('month', visited_at) as period,
          COUNT(*) as count
        FROM visits
        WHERE destination_id = $1
        GROUP BY period
      )
      SELECT 
        COALESCE(ds.visit_count, 0) as total_visits,
        COALESCE(ds.avg_rating, 0) as average_rating,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'period', period,
              'count', count
            )
          ) FROM visit_periods),
          '[]'::json
        ) as visitsByPeriod
      FROM destinations d
      LEFT JOIN destination_stats ds ON ds.destination_id = d.id
      WHERE d.id = $1
    `, [id]);
    
    return result.rows[0] || {
      total_visits: 0,
      average_rating: 0,
      visitsByPeriod: []
    };
  }
} 