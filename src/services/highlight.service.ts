import { Pool } from 'pg';
import { Highlight } from '../types/highlight';
import { HighlightView } from '../types/highlight_view';

export class HighlightService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Highlight[]> {
    const query = `
      SELECT *
      FROM highlights
      WHERE hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Highlight>(query);
    return result.rows;
  }

  async getById(id: number): Promise<Highlight | null> {
    const query = `
      SELECT *
      FROM highlights
      WHERE id = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Highlight>(query, [id]);
    return result.rows[0] || null;
  }

  async getByDestination(destinationId: number): Promise<Highlight[]> {
    const query = `
      SELECT *
      FROM highlights
      WHERE destination_id = $1 AND hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Highlight>(query, [destinationId]);
    return result.rows;
  }

  async getBySlugAndDestinationSlug(slug: string, destinationSlug: string): Promise<Highlight | null> {
    const query = `
      SELECT h.*
      FROM highlights h
      JOIN destinations d ON h.destination_id = d.id
      WHERE h.slug = $1 AND d.slug = $2 AND h.hidden = false
    `;

    const result = await this.pool.query<Highlight>(query, [slug, destinationSlug]);
    return result.rows[0] || null;
  }

  async getByCoordinates(latitude: number, longitude: number, radiusKm: number): Promise<Highlight[]> {
    const query = `
      SELECT *
      FROM highlights
      WHERE hidden = false
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND earth_box(ll_to_earth($1, $2), $3) @> ll_to_earth(latitude, longitude)
      ORDER BY 
        earth_distance(ll_to_earth($1, $2), ll_to_earth(latitude, longitude)) ASC
    `;
    
    const result = await this.pool.query<Highlight>(query, [latitude, longitude, radiusKm * 1000]);
    return result.rows;
  }

  async recordView(userId: number, highlightId: number): Promise<HighlightView> {
    const query = `
      INSERT INTO highlight_views (user_id, highlight_id, seen_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const result = await this.pool.query<HighlightView>(query, [userId, highlightId]);
    return result.rows[0];
  }

  async getViewsByUser(userId: number): Promise<HighlightView[]> {
    const query = `
      SELECT *
      FROM highlight_views
      WHERE user_id = $1
      ORDER BY seen_at DESC
    `;
    
    const result = await this.pool.query<HighlightView>(query, [userId]);
    return result.rows;
  }

  async getViewsByHighlight(highlightId: number): Promise<HighlightView[]> {
    const query = `
      SELECT *
      FROM highlight_views
      WHERE highlight_id = $1
      ORDER BY seen_at DESC
    `;
    
    const result = await this.pool.query<HighlightView>(query, [highlightId]);
    return result.rows;
  }

  async getViewStats(highlightId: number): Promise<{
    total_views: number;
    unique_viewers: number;
    last_view: Date | null;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_views,
        COUNT(DISTINCT user_id) as unique_viewers,
        MAX(seen_at) as last_view
      FROM highlight_views
      WHERE highlight_id = $1
    `;
    
    const result = await this.pool.query(query, [highlightId]);
    return result.rows[0];
  }

  async getBySlug(slug: string): Promise<Highlight | null> {
    const result = await this.pool.query(
      'SELECT * FROM highlights WHERE slug = $1 AND hidden = false',
      [slug]
    );
    return result.rows[0] || null;
  }
}