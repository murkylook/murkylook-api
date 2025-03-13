import { Pool } from 'pg';
import { Language } from '../types/language';

export class LanguageService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Language[]> {
    const query = `
      SELECT *
      FROM languages
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<Language>(query);
    return result.rows;
  }

  async getById(id: number): Promise<Language | null> {
    const query = `
      SELECT *
      FROM languages
      WHERE id = $1
    `;
    
    const result = await this.pool.query<Language>(query, [id]);
    return result.rows[0] || null;
  }

  async getByCode(code: string): Promise<Language | null> {
    const query = `
      SELECT *
      FROM languages
      WHERE code = $1
    `;
    
    const result = await this.pool.query<Language>(query, [code]);
    return result.rows[0] || null;
  }
} 