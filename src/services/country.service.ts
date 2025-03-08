import { Pool } from 'pg';
import { BaseService } from './base.service';
import { 
  Country,
  CountryInput,
  CountryUpdateInput,
  CountryFilters 
} from '../types/country';
import { BaseFilters } from '../types/base';

export class CountryService extends BaseService<Country, CountryInput, CountryUpdateInput> {
  constructor(pool: Pool) {
    super(pool, 'countries');
  }

  protected mapFilters(filters: BaseFilters): Record<string, any> {
    const typedFilters = filters as CountryFilters;
    return {
      ...(typedFilters.search && { 
        name: typedFilters.search 
      }),
      ...(typedFilters.abbreviation && { 
        abbreviation: typedFilters.abbreviation 
      }),
      ...(typedFilters.continent_id && {
        continent_id: typedFilters.continent_id
      }),
      ...(typedFilters.ids?.length && {
        id: typedFilters.ids
      })
    };
  }

  async findByAbbreviation(abbreviation: string): Promise<Country | null> {
    const result = await this.pool.query<Country>(
      'SELECT * FROM countries WHERE abbreviation = $1',
      [abbreviation]
    );
    return result.rows[0] || null;
  }

  async getStats(id: string): Promise<{ total_destinations: number; total_visits: number }> {
    const result = await this.pool.query<{ total_destinations: number; total_visits: number }>(
      `SELECT total_visits, total_destinations
       FROM countries 
       WHERE id = $1`,
      [id]
    );
    
    return {
      total_destinations: result.rows[0]?.total_destinations || 0,
      total_visits: result.rows[0]?.total_visits || 0
    };
  }

  async search(term: string): Promise<Country[]> {
    const result = await this.pool.query<Country>(
      `SELECT * FROM countries 
       WHERE name ILIKE $1 OR abbreviation ILIKE $1
       ORDER BY name ASC`,
      [`%${term}%`]
    );
    return result.rows;
  }

  async findByContinent(continentId: string): Promise<Country[]> {
    const result = await this.pool.query<Country>(
      `SELECT * FROM countries 
       WHERE continent_id = $1 
       ORDER BY name ASC`,
      [continentId]
    );
    return result.rows;
  }
} 