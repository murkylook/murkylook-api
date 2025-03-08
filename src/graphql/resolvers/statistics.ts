import { IResolvers } from '@graphql-tools/utils';
import { AuthenticationError } from 'apollo-server-express';
import { StatisticsService } from '../../services/statistics.service';
import { Context } from '../../types/context';

export const statisticsResolvers: IResolvers = {
    Query: {
        globalStatistics: async (_, __, { pgPool, currentUser }) => {
            if (!currentUser?.is_admin) {
                throw new AuthenticationError('Only administrators can view global statistics');
            }

            const result = await pgPool.query(`
                SELECT
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM continents) as total_continents,
                    (SELECT COUNT(*) FROM countries) as total_countries,
                    (SELECT COUNT(*) FROM destinations) as total_destinations,
                    (SELECT COUNT(*) FROM visits) as total_visits
            `);

            return result.rows[0];
        },
        
        trendingStatistics: async (_, { days = 30 }, { pgPool, currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError('You must be logged in to view trending statistics');
            }

            const result = await pgPool.query(`
                SELECT
                    d.id,
                    d.name,
                    c.name as country_name,
                    COUNT(v.id) as visit_count
                FROM destinations d
                JOIN countries c ON c.id = d.country_id
                JOIN visits v ON v.destination_id = d.id
                WHERE v.visited_at >= NOW() - INTERVAL '${days} days'
                GROUP BY d.id, c.name
                ORDER BY visit_count DESC
                LIMIT 10
            `);

            return result.rows;
        },

        statistics: async (_, __, { pgPool }: Context) => {
            const service = new StatisticsService(pgPool);
            return service.getGlobalStats();
        },

        visitTrends: async (_, { period = 'month', limit = 12 }, { pgPool }: Context) => {
            const service = new StatisticsService(pgPool);
            return service.getVisitTrends(period, limit);
        },

        topDestinations: async (_, { limit = 10 }, { pgPool }: Context) => {
            const service = new StatisticsService(pgPool);
            return service.getTopDestinations(limit);
        },

        topCountries: async (_, { limit = 10 }, { pgPool }: Context) => {
            const service = new StatisticsService(pgPool);
            return service.getTopCountries(limit);
        }
    }
}; 