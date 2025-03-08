import { IResolvers } from '@graphql-tools/utils';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { UserService } from '../../services/user.service';
import { Context } from '../../types/context';
import { User } from '../../types/user';

export const userResolvers: IResolvers = {
    Query: {

        user: async (_, { id }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.findById(id);
        },

        users: async (_, { filter, pagination, orderBy }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.findAll({ filters: filter, pagination, orderBy });
        },

        userStats: async (_, { id, period }, { pgPool, currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError('You must be logged in to view user statistics');
            }
            if (id !== currentUser.id && !currentUser.is_admin) {
                throw new ForbiddenError('Not authorized to view these statistics');
            }

            const basicStats = await pgPool.query(`
                SELECT 
                    u.*,
                    COUNT(DISTINCT v.id) as total_visits,
                    COUNT(DISTINCT v.destination_id) as unique_destinations,
                    COUNT(DISTINCT c.id) as countries_visited,
                    COUNT(DISTINCT cont.id) as continents_visited
                FROM users u
                LEFT JOIN visits v ON v.user_id = u.id
                LEFT JOIN destinations d ON d.id = v.destination_id
                LEFT JOIN countries c ON c.id = d.country_id
                LEFT JOIN continents cont ON cont.id = c.continent_id
                WHERE u.id = $1
                GROUP BY u.id
            `, [id]);

            const visitsByPeriod = await pgPool.query(`
                SELECT 
                    DATE_TRUNC($1, v.visited_at) as period,
                    COUNT(*) as visit_count,
                    COUNT(DISTINCT v.destination_id) as unique_destinations
                FROM visits v
                WHERE v.user_id = $2
                GROUP BY period
                ORDER BY period DESC
                LIMIT $3
            `, [period.period, id, period.count]);

            const favoriteDestinations = await pgPool.query(`
                SELECT 
                    d.*,
                    COUNT(v.id) as visit_count
                FROM destinations d
                JOIN visits v ON v.destination_id = d.id
                WHERE v.user_id = $1
                GROUP BY d.id
                ORDER BY visit_count DESC
                LIMIT 5
            `, [id]);

            return {
                ...basicStats.rows[0],
                visitsByPeriod: visitsByPeriod.rows,
                favoriteDestinations: favoriteDestinations.rows
            };
        },

        mostActiveUsers: async (_, { limit = 5 }, { pgPool, currentUser }) => {
            if (!currentUser?.is_admin) {
                throw new ForbiddenError('Only administrators can view user rankings');
            }

            const result = await pgPool.query(`
                SELECT 
                    u.*,
                    COUNT(v.id) as visit_count,
                    COUNT(DISTINCT v.destination_id) as unique_destinations,
                    COUNT(DISTINCT c.id) as countries_visited,
                    COALESCE(AVG(v.rating), 0) as average_rating
                FROM users u
                LEFT JOIN visits v ON v.user_id = u.id
                LEFT JOIN destinations d ON d.id = v.destination_id
                LEFT JOIN countries c ON c.id = d.country_id
                GROUP BY u.id
                ORDER BY visit_count DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        },

        userByEmail: async (_, { email }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.findByEmail(email);
        }
    },

    Mutation: {
        createUser: async (_, { input }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.create(input);
        },

        updateUser: async (_, { id, input }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.update(id, input);
        },

        deleteUser: async (_, { id }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.delete(id);
        }
    },

    User: {

        visits: async (user: User, _, { pgPool, loaders }: Context) => {
            const result = await pgPool.query(
                'SELECT id FROM visits WHERE user_id = $1',
                [user.id]
            );
            return loaders.visitLoader.loadMany(result.rows.map(row => row.id));
        },

        recentActivity: async (parent, { limit = 5 }, { pgPool, currentUser }) => {
            if (!currentUser || (parent.id !== currentUser.id && !currentUser.is_admin)) {
                throw new ForbiddenError('Not authorized to view this activity');
            }

            const result = await pgPool.query(`
                SELECT 
                    v.*,
                    d.name as destination_name,
                    c.name as country_name,
                    cont.name as continent_name
                FROM visits v
                JOIN destinations d ON d.id = v.destination_id
                JOIN countries c ON c.id = d.country_id
                JOIN continents cont ON cont.id = c.continent_id
                WHERE v.user_id = $1
                ORDER BY v.visited_at DESC
                LIMIT $2
            `, [parent.id, limit]);
            return result.rows;
        },

        stats: async (user: User, _, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.getStats(user.id);
        },

        recentVisits: async (user: User, { limit = 5 }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.getRecentVisits(user.id, limit);
        },

        topCountries: async (user: User, { limit = 5 }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.getTopCountries(user.id, limit);
        }
    }
}; 