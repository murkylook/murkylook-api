import { IResolvers } from '@graphql-tools/utils';
import { ForbiddenError } from 'apollo-server-express';
import { Context } from '../../types/context';
import { VisitService } from '../../services/visit.service';

export const visitResolvers: IResolvers = {
    Query: {

        visit: async (_, { id }, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.findById(id);
        },

        visits: async (_, { filter, pagination, orderBy }, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.findAll({ filters: filter, pagination, orderBy });
        },

        visitsByUser: async (_, { userId }, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.findByUser(userId);
        },

        visitsByDestination: async (_, { destinationId }, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.findByDestination(destinationId);
        },

        visitStats: async (_, { period }, { pgPool, currentUser }) => {
            // Check admin authorization
            if (!currentUser?.is_admin) {
                throw new ForbiddenError('Only administrators can view global visit statistics');
            }

            // Get global stats
            const globalStats = await pgPool.query(`
                SELECT 
                    COUNT(*) as total_visits,
                    COUNT(DISTINCT user_id) as unique_visitors,
                    COUNT(DISTINCT destination_id) as unique_destinations,
                    COALESCE(AVG(rating), 0) as average_rating,
                    MIN(visited_at) as first_visit,
                    MAX(visited_at) as last_visit
                FROM visits
            `);

            // Get visits by period
            const visitsByPeriod = await pgPool.query(`
                SELECT 
                    DATE_TRUNC($1, visited_at) as period,
                    COUNT(*) as visit_count,
                    COUNT(DISTINCT user_id) as unique_visitors,
                    COUNT(DISTINCT destination_id) as unique_destinations,
                    COALESCE(AVG(rating), 0) as average_rating
                FROM visits
                GROUP BY period
                ORDER BY period DESC
                LIMIT $2
            `, [period.period, period.count]);

            // Get popular visit times
            const popularTimes = await pgPool.query(`
                SELECT 
                    EXTRACT(HOUR FROM visited_at) as hour,
                    COUNT(*) as visit_count
                FROM visits
                GROUP BY hour
                ORDER BY visit_count DESC
            `);

            return {
                ...globalStats.rows[0],
                visitsByPeriod: visitsByPeriod.rows,
                popularVisitTimes: popularTimes.rows
            };
        }
    },

    Mutation: {

        createVisit: async (_, { input }, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.create(input);
        },

        updateVisit: async (_, { id, input }, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.update(id, input);
        },

        deleteVisit: async (_, { id }, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.delete(id);
        }
    },

    Visit: {
        user: async (visit, _, { loaders }: Context) => {
            return loaders.userLoader.load(visit.user_id);
        },

        destination: async (visit, _, { loaders }: Context) => {
            return loaders.destinationLoader.load(visit.destination_id);
        },

        stats: async (visit, _, { pgPool }: Context) => {
            const service = new VisitService(pgPool);
            return service.getStats(visit.id);
        },

        similarVisits: async (parent, { limit = 5 }, { pgPool }) => {
            // Find visits to the same destination or country within a similar time period
            const result = await pgPool.query(`
                SELECT 
                    v.*,
                    u.name as user_name,
                    d.name as destination_name
                FROM visits v
                JOIN users u ON u.id = v.user_id
                JOIN destinations d ON d.id = v.destination_id
                JOIN destinations d2 ON d2.country_id = d.country_id
                WHERE v.id != $1
                    AND v.destination_id = $2
                    AND ABS(EXTRACT(EPOCH FROM (v.visited_at - $3))) < 86400 * 30  -- Within 30 days
                ORDER BY v.visited_at DESC
                LIMIT $4
            `, [parent.id, parent.destination_id, parent.visited_at, limit]);
            return result.rows;
        }
    }
}; 