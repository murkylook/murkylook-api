import { Pool } from 'pg';
import { DestinationType } from '../types/destination-type';

export class DestinationTypeService {
  constructor(private readonly pool: Pool) {}

  async getAll(): Promise<DestinationType[]> {
    const query = `
      SELECT *
      FROM destination_types
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<DestinationType>(query);
    return result.rows;
  }

  async getById(id: number): Promise<DestinationType | null> {
    const query = `
      SELECT *
      FROM destination_types
      WHERE id = $1
    `;
    
    const result = await this.pool.query<DestinationType>(query, [id]);
    return result.rows[0] || null;
  }

  async getByName(name: string): Promise<DestinationType | null> {
    const query = `
      SELECT *
      FROM destination_types
      WHERE name = $1
    `;
    
    const result = await this.pool.query<DestinationType>(query, [name]);
    return result.rows[0] || null;
  }

  async getDestinationIds(typeId: number): Promise<number[]> {
    const query = `
      SELECT id
      FROM destinations
      WHERE type_id = $1 AND hidden = false
      ORDER BY name ASC
    `;
    
    const result = await this.pool.query<{ id: number }>(query, [typeId]);
    return result.rows.map(row => row.id);
  }
}