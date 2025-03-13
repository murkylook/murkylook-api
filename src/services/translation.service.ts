import { Pool } from 'pg';
import { Translation } from '../types/translation';

export class TranslationService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<Translation[]> {
    const query = `
      SELECT *
      FROM translations
      ORDER BY table_name, column_name, row_id, language_id
    `;
    
    const result = await this.pool.query<Translation>(query);
    return result.rows;
  }

  async getById(id: number): Promise<Translation | null> {
    const query = `
      SELECT *
      FROM translations
      WHERE id = $1
    `;
    
    const result = await this.pool.query<Translation>(query, [id]);
    return result.rows[0] || null;
  }

  async getByLanguage(languageId: number): Promise<Translation[]> {
    const query = `
      SELECT *
      FROM translations
      WHERE language_id = $1
      ORDER BY table_name, column_name, row_id
    `;
    
    const result = await this.pool.query<Translation>(query, [languageId]);
    return result.rows;
  }

  async getByTableAndRow(tableName: string, rowId: number): Promise<Translation[]> {
    const query = `
      SELECT *
      FROM translations
      WHERE table_name = $1 AND row_id = $2
      ORDER BY column_name, language_id
    `;
    
    const result = await this.pool.query<Translation>(query, [tableName, rowId]);
    return result.rows;
  }

  async getByTableRowAndColumn(tableName: string, rowId: number, columnName: string): Promise<Translation[]> {
    const query = `
      SELECT *
      FROM translations
      WHERE table_name = $1 AND row_id = $2 AND column_name = $3
      ORDER BY language_id
    `;
    
    const result = await this.pool.query<Translation>(query, [tableName, rowId, columnName]);
    return result.rows;
  }

  async getByTableRowColumnAndLanguage(
    tableName: string, 
    rowId: number, 
    columnName: string, 
    languageId: number
  ): Promise<Translation | null> {
    const query = `
      SELECT *
      FROM translations
      WHERE table_name = $1 
        AND row_id = $2 
        AND column_name = $3 
        AND language_id = $4
    `;
    
    const result = await this.pool.query<Translation>(query, [tableName, rowId, columnName, languageId]);
    return result.rows[0] || null;
  }
} 