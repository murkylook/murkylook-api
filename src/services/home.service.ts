import { Pool } from 'pg';

export type HomeStats = {
  totalDestinations: number;
  totalCountries: number;
  totalHighlights: number;
  totalUsers: number;
  totalVisits: number;
  totalViews: number;
};

export class HomeService {
  constructor(private readonly pool: Pool) {}

  async getStats(): Promise<HomeStats> {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM destinations WHERE hidden = false) as total_destinations,
        (SELECT COUNT(*) FROM countries WHERE hidden = false) as total_countries,
        (SELECT COUNT(*) FROM highlights WHERE hidden = false) as total_highlights,
        (SELECT COUNT(*) FROM users WHERE hidden = false) as total_users,
        (SELECT COUNT(*) FROM destination_visits) as total_visits,
        (SELECT COUNT(*) FROM highlights_views) as total_views
    `;
    
    const result = await this.pool.query(query);
    const stats = result.rows[0];
    
    return {
      totalDestinations: parseInt(stats.total_destinations),
      totalCountries: parseInt(stats.total_countries),
      totalHighlights: parseInt(stats.total_highlights),
      totalUsers: parseInt(stats.total_users),
      totalVisits: parseInt(stats.total_visits),
      totalViews: parseInt(stats.total_views)
    };
  }

  async getActiveStats(): Promise<{
    recentVisits: number;
    recentViews: number;
    activeUsers: number;
  }> {
    const query = `
      SELECT
        (
          SELECT COUNT(*)
          FROM destination_visits
          WHERE visited_at > NOW() - INTERVAL '7 days'
        ) as recent_visits,
        (
          SELECT COUNT(*)
          FROM highlight_views
          WHERE seen_at > NOW() - INTERVAL '7 days'
        ) as recent_views,
        (
          SELECT COUNT(DISTINCT user_id)
          FROM (
            SELECT user_id FROM destination_visits WHERE visited_at > NOW() - INTERVAL '30 days'
            UNION
            SELECT user_id FROM highlight_views WHERE seen_at > NOW() - INTERVAL '30 days'
          ) as active_users
        ) as active_users
    `;
    
    const result = await this.pool.query(query);
    const stats = result.rows[0];
    
    return {
      recentVisits: parseInt(stats.recent_visits),
      recentViews: parseInt(stats.recent_views),
      activeUsers: parseInt(stats.active_users)
    };
  }
}
