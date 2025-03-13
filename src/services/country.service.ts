import { Pool } from 'pg';
import { Country } from '../types/country';

export class CountryService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Country[]> {
    const query = `
      SELECT *
      FROM countries
      WHERE hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Country>(query);
    return result.rows;
  }

  async getById(id: number): Promise<Country | null> {
    const query = `
      SELECT *
      FROM countries
      WHERE id = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Country>(query, [id]);
    return result.rows[0] || null;
  }

  async getByIso(isoCode: string): Promise<Country | null> {
    const query = `
      SELECT *
      FROM countries
      WHERE iso_code = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Country>(query, [isoCode]);
    return result.rows[0] || null;
  }

  async getByIso3(isoCode3: string): Promise<Country | null> {
    const query = `
      SELECT *
      FROM countries
      WHERE iso_code3 = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Country>(query, [isoCode3]);
    return result.rows[0] || null;
  }

  async getByName(name: string): Promise<Country | null> {
    const query = `
      SELECT *
      FROM countries
      WHERE name = $1 AND hidden = false
    `;
    
    const result = await this.pool.query<Country>(query, [name]);
    return result.rows[0] || null;
  }

  async getDestinationIds(countryId: number): Promise<number[]> {
    const query = `
      SELECT id 
      FROM destinations 
      WHERE country_id = $1 AND hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<{ id: number }>(query, [countryId]);
    return result.rows.map(row => row.id);
  }
}