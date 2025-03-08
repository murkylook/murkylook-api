import { Pool } from 'pg';
import { BaseService } from './base.service';
import { 
  Continent,
  ContinentInput,
  ContinentUpdateInput,
  ContinentFilters 
} from '../types/continent';
import { BaseFilters } from '../types/base';

export class ContinentService extends BaseService<Continent, ContinentInput, ContinentUpdateInput> {
  constructor(pool: Pool) {
    super(pool, 'continents');
  }

  protected mapFilters(filters: BaseFilters): Record<string, any> {
    const typedFilters = filters as ContinentFilters;
    return {
      ...(typedFilters.search && { 
        name: typedFilters.search 
      }),
      ...(typedFilters.abbreviation && { 
        abbreviation: typedFilters.abbreviation 
      }),
      ...(typedFilters.ids?.length && {
        id: typedFilters.ids
      })
    };
  }

  async findByAbbreviation(abbreviation: string): Promise<Continent | null> {
    const result = await this.pool.query<Continent>(
      'SELECT * FROM continents WHERE abbreviation = $1 AND hidden = false',
      [abbreviation]
    );
    return result.rows[0] || null;
  }

  async getStats(id: string): Promise<{ total_visits: number; total_countries: number; total_destinations: number }> {
    const result = await this.pool.query<{ total_visits: string; total_countries: string; total_destinations: string }>(
      `SELECT 
        (SELECT COUNT(*) FROM countries WHERE continent_id = $1 AND hidden = false) as total_countries,
        (SELECT COUNT(*) FROM destinations d 
         JOIN countries c ON c.id = d.country_id 
         WHERE c.continent_id = $1 AND d.hidden = false AND c.hidden = false) as total_destinations,
        (SELECT COUNT(*) FROM visits v
         JOIN destinations d ON d.id = v.destination_id
         JOIN countries c ON c.id = d.country_id
         WHERE c.continent_id = $1 AND d.hidden = false AND c.hidden = false) as total_visits`,
      [id]
    );
    
    return {
      total_countries: parseInt(result.rows[0].total_countries, 10),
      total_destinations: parseInt(result.rows[0].total_destinations, 10),
      total_visits: parseInt(result.rows[0].total_visits, 10)
    };
  }

  async search(term: string): Promise<Continent[]> {
    const result = await this.pool.query<Continent>(
      `SELECT * FROM continents 
       WHERE (name ILIKE $1 OR abbreviation ILIKE $1)
       AND hidden = false
       ORDER BY name ASC`,
      [`%${term}%`]
    );
    return result.rows;
  }
} 