import { Pool } from 'pg';
import { Continent } from '../types/continent';
import { Country } from '../types/country';

export class ContinentService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Continent[]> {
    const query = `
      SELECT *
      FROM continents
      WHERE hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Continent>(query);
    return result.rows;
  }

  async getById(id: number): Promise<Continent | null> {
    const query = `
      SELECT *
      FROM continents
      WHERE id = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Continent>(query, [id]);
    return result.rows[0] || null;
  }

  async getByCode(code: string): Promise<Continent | null> {
    const query = `
      SELECT *
      FROM continents
      WHERE code = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Continent>(query, [code]);
    return result.rows[0] || null;
  }

  async getCountries(continentId: number): Promise<Country[]> {
    const query = `
      SELECT *
      FROM countries
      WHERE continent_id = $1 AND hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Country>(query, [continentId]);
    return result.rows;
  }

  async getBySlug(slug: string): Promise<Continent | null> {
    const result = await this.pool.query(
      'SELECT * FROM continents WHERE slug = $1 AND hidden = false',
      [slug]
    );
    return result.rows[0] || null;
  }
} 