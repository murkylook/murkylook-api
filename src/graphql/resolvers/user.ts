/**
 * User Resolver
 * Handles all user-related queries and field resolvers
 * Implements authorization checks and data access controls
 */

import { IResolvers } from '@graphql-tools/utils';
import { AuthenticationError, ForbiddenError } from 'apollo-server-express';

export const userResolvers: IResolvers = {
    Query: {
        /**
         * Fetches a single user by ID
         * 
         * Authorization:
         * - Users can only view their own details
         * - Admins can view any user's details
         * 
         * @param id - The ID of the user to fetch
         * @throws AuthenticationError if not logged in
         * @throws ForbiddenError if not authorized
         * 
         * Example query:
         * query GetUser($id: ID!) {
         *   user(id: $id) {
         *     id
         *     name
         *     total_visits
         *     unique_destinations_visited
         *   }
         * }
         */
        user: async (_, { id }, { pgPool, currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError('You must be logged in to view user details');
            }

            if (id !== currentUser.id && !currentUser.is_admin) {
                throw new ForbiddenError('Not authorized to view this user\'s details');
            }

            const result = await pgPool.query(`
                SELECT 
                    u.*,
                    COUNT(DISTINCT v.id) as total_visits,
                    COUNT(DISTINCT v.destination_id) as unique_destinations_visited
                FROM users u
                LEFT JOIN visits v ON v.user_id = u.id
                WHERE u.id = $1
                GROUP BY u.id
            `, [id]);
            return result.rows[0];
        },

        /**
         * Lists users with filtering and pagination
         * 
         * Authorization:
         * - Admin only endpoint
         * 
         * Features:
         * - Search by name or email
         * - Order by various criteria
         * - Pagination support
         * - Visit statistics included
         * 
         * @throws ForbiddenError if not admin
         * 
         * Example query:
         * query ListUsers($searchTerm: String, $orderBy: UserOrderBy) {
         *   users(searchTerm: $searchTerm, orderBy: $orderBy) {
         *     items {
         *       id
         *       name
         *       visit_count
         *       destinations_visited
         *     }
         *     totalCount
         *     hasMore
         *   }
         * }
         */
        users: async (_, { 
            searchTerm,
            orderBy,
            limit = 10,
            offset = 0 
        }, { pgPool, currentUser }) => {
            if (!currentUser?.is_admin) {
                throw new ForbiddenError('Only administrators can list users');
            }

            let query = `
                SELECT 
                    u.*,
                    COUNT(DISTINCT v.id) as visit_count,
                    COUNT(DISTINCT v.destination_id) as destinations_visited
                FROM users u
                LEFT JOIN visits v ON v.user_id = u.id
            `;

            const params = [];
            let paramCount = 1;

            if (searchTerm) {
                query += ` WHERE u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount}`;
                params.push(`%${searchTerm}%`);
                paramCount++;
            }

            query += ` GROUP BY u.id`;

            if (orderBy) {
                switch (orderBy) {
                    case 'VISITS_DESC':
                        query += ` ORDER BY visit_count DESC`;
                        break;
                    case 'DESTINATIONS_DESC':
                        query += ` ORDER BY destinations_visited DESC`;
                        break;
                    case 'RECENTLY_ACTIVE':
                        query += ` ORDER BY u.last_login_at DESC NULLS LAST`;
                        break;
                    case 'RECENTLY_JOINED':
                        query += ` ORDER BY u.created_at DESC`;
                        break;
                    default:
                        query += ` ORDER BY u.name`;
                }
            } else {
                query += ` ORDER BY u.name`;
            }

            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await pgPool.query(query, params);

            // Get total count
            let countQuery = `SELECT COUNT(*) FROM users`;
            if (searchTerm) {
                countQuery += ` WHERE name ILIKE $1 OR email ILIKE $1`;
            }
            const totalCount = await pgPool.query(countQuery, searchTerm ? [`%${searchTerm}%`] : []);

            return {
                items: result.rows,
                totalCount: parseInt(totalCount.rows[0].count),
                hasMore: offset + limit < parseInt(totalCount.rows[0].count)
            };
        },

        /**
         * Fetches detailed statistics for a user
         * 
         * Features:
         * - Basic user stats (total visits, unique destinations)
         * - Geographic coverage (countries, continents visited)
         * - Time-based analysis (visits by period)
         * - Favorite destinations
         * 
         * Authorization:
         * - Users can only view their own stats
         * - Admins can view any user's stats
         * 
         * @throws AuthenticationError if not logged in
         * @throws ForbiddenError if not authorized
         * 
         * Example query:
         * query UserStats($id: ID!, $period: PeriodInput!) {
         *   userStats(id: $id, period: $period) {
         *     total_visits
         *     unique_destinations
         *     countries_visited
         *     continents_visited
         *     visitsByPeriod {
         *       period
         *       visit_count
         *     }
         *   }
         * }
         */
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
        }
    },

    User: {
        /**
         * Resolves the visits field for a User type
         * Returns paginated list of visits for the user
         * 
         * Features:
         * - Pagination support
         * - Ordered by visit date
         * - Includes destination and country info
         * 
         * @throws ForbiddenError if not authorized
         */
        visits: async (parent, { limit = 10, offset = 0 }, { pgPool, currentUser }) => {
            if (!currentUser || (parent.id !== currentUser.id && !currentUser.is_admin)) {
                throw new ForbiddenError('Not authorized to view these visits');
            }

            const result = await pgPool.query(`
                SELECT 
                    v.*,
                    d.name as destination_name,
                    c.name as country_name
                FROM visits v
                JOIN destinations d ON d.id = v.destination_id
                JOIN countries c ON c.id = d.country_id
                WHERE v.user_id = $1
                ORDER BY v.visited_at DESC
                LIMIT $2 OFFSET $3
            `, [parent.id, limit, offset]);
            return result.rows;
        },

        /**
         * Resolves recent activity for a user
         * Shows latest visits with full location context
         * 
         * @throws ForbiddenError if not authorized
         */
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
        }
    }
}; 