import { Pool } from 'pg';

export class StatisticsService {
  constructor(private readonly pool: Pool) {}

  async getGlobalStats(): Promise<{
    total_users: number;
    total_visits: number;
    total_destinations: number;
    total_countries: number;
  }> {
    const result = await this.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM visits) as total_visits,
        (SELECT COUNT(*) FROM destinations) as total_destinations,
        (SELECT COUNT(*) FROM countries) as total_countries
    `);
    
    return {
      total_users: parseInt(result.rows[0].total_users, 10),
      total_visits: parseInt(result.rows[0].total_visits, 10),
      total_destinations: parseInt(result.rows[0].total_destinations, 10),
      total_countries: parseInt(result.rows[0].total_countries, 10)
    };
  }

  async getVisitTrends(period: string = 'month', limit: number = 12): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT 
        date_trunc($1, visited_at) as period,
        COUNT(*) as visit_count
      FROM visits
      GROUP BY period
      ORDER BY period DESC
      LIMIT $2
    `, [period, limit]);
    
    return result.rows;
  }

  async getTopDestinations(limit: number = 10): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT 
        d.*,
        COUNT(v.id) as visit_count
      FROM destinations d
      LEFT JOIN visits v ON v.destination_id = d.id
      GROUP BY d.id
      ORDER BY visit_count DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }

  async getTopCountries(limit: number = 10): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT 
        c.*,
        COUNT(v.id) as visit_count
      FROM countries c
      LEFT JOIN destinations d ON d.country_id = c.id
      LEFT JOIN visits v ON v.destination_id = d.id
      GROUP BY c.id
      ORDER BY visit_count DESC
      LIMIT $1
    `, [limit]);
    
    return result.rows;
  }
} 