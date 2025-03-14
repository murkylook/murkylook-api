import { Pool } from 'pg';
import { Destination } from '../types/destination';
import { DestinationVisit } from '../types/destination_visit';

export class DestinationService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Destination[]> {
    const query = `
      SELECT *
      FROM destinations
      WHERE hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Destination>(query);
    return result.rows;
  }

  async getById(id: number): Promise<Destination | null> {
    const query = `
      SELECT *
      FROM destinations
      WHERE id = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Destination>(query, [id]);
    return result.rows[0] || null;
  }

  async getByCountry(countryId: number): Promise<Destination[]> {
    const query = `
      SELECT *
      FROM destinations
      WHERE country_id = $1 AND hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Destination>(query, [countryId]);
    return result.rows;
  }

  async getByType(typeId: number): Promise<Destination[]> {
    const query = `
      SELECT *
      FROM destinations
      WHERE type_id = $1 AND hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Destination>(query, [typeId]);
    return result.rows;
  }

  async getHighlightIds(destinationId: number): Promise<number[]> {
    const query = `
      SELECT id
      FROM highlights
      WHERE destination_id = $1 AND hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<{ id: number }>(query, [destinationId]);
    return result.rows.map(row => row.id);
  }

  async recordVisit(userId: number, destinationId: number): Promise<DestinationVisit> {
    const query = `
      INSERT INTO destination_visits (user_id, destination_id, visited_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await this.pool.query<DestinationVisit>(query, [userId, destinationId]);
    return result.rows[0];
  }

  async getVisitsByUser(userId: number): Promise<DestinationVisit[]> {
    const query = `
      SELECT *
      FROM destination_visits
      WHERE user_id = $1
      ORDER BY visited_at DESC
    `;
    
    const result = await this.pool.query<DestinationVisit>(query, [userId]);
    return result.rows;
  }

  async getVisitsByDestination(destinationId: number): Promise<DestinationVisit[]> {
    const query = `
      SELECT *
      FROM destination_visits
      WHERE destination_id = $1
      ORDER BY visited_at DESC
    `;
    
    const result = await this.pool.query<DestinationVisit>(query, [destinationId]);
    return result.rows;
  }

  async getVisitStats(destinationId: number): Promise<{
    total_visits: number;
    unique_visitors: number;
    last_visit: Date | null;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT user_id) as unique_visitors,
        MAX(visited_at) as last_visit
      FROM destination_visits
      WHERE destination_id = $1
    `;
    
    const result = await this.pool.query(query, [destinationId]);
    return result.rows[0];
  }

  async getBySlug(slug: string): Promise<Destination | null> {
    const result = await this.pool.query(
      'SELECT * FROM destinations WHERE slug = $1 AND hidden = false',
      [slug]
    );
    return result.rows[0] || null;
  }
}