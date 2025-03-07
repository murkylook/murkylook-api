/**
 * Visit Resolver
 * Handles all visit-related queries and field resolvers
 * Core functionality for tracking user visits to destinations
 */

import { IResolvers } from '@graphql-tools/utils';
import { AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server-express';

export const visitResolvers: IResolvers = {
    Query: {
        /**
         * Fetches a single visit by ID
         * 
         * Features:
         * - Full visit details
         * - Related destination info
         * - User information
         * - Geographic context (country, continent)
         * 
         * Authorization:
         * - Users can only view their own visits
         * - Admins can view any visit
         * 
         * @throws AuthenticationError if not logged in
         * @throws ForbiddenError if not authorized
         * 
         * Example query:
         * query GetVisit($id: ID!) {
         *   visit(id: $id) {
         *     id
         *     visited_at
         *     rating
         *     destination_name
         *     country_name
         *
         */
        visit: async (_, { id }, { pgPool, currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError('You must be logged in to view visit details');
            }

            const result = await pgPool.query(`
                SELECT 
                    v.*,
                    d.name as destination_name,
                    c.name as country_name,
                    cont.name as continent_name,
                    u.name as user_name
                FROM visits v
                JOIN destinations d ON d.id = v.destination_id
                JOIN countries c ON c.id = d.country_id
                JOIN continents cont ON cont.id = c.continent_id
                JOIN users u ON u.id = v.user_id
                WHERE v.id = $1
            `, [id]);

            if (result.rows[0] && result.rows[0].user_id !== currentUser.id && !currentUser.is_admin) {
                throw new ForbiddenError('Not authorized to view this visit');
            }

            return result.rows[0];
        },

        visits: async (_, { 
            userId,
            destinationId,
            countryId,
            continentId,
            dateRange,
            orderBy,
            limit = 10,
            offset = 0 
        }, { pgPool, currentUser }) => {
            // Check authentication
            if (!currentUser) {
                throw new AuthenticationError('You must be logged in to view visits');
            }

            let query = `
                SELECT 
                    v.*,
                    d.name as destination_name,
                    c.name as country_name,
                    cont.name as continent_name,
                    u.name as user_name
                FROM visits v
                JOIN destinations d ON d.id = v.destination_id
                JOIN countries c ON c.id = d.country_id
                JOIN continents cont ON cont.id = c.continent_id
                JOIN users u ON u.id = v.user_id
            `;

            const conditions = [];
            const params = [];
            let paramCount = 1;

            // Handle authorization - non-admins can only see their own visits
            if (!currentUser.is_admin) {
                conditions.push(`v.user_id = $${paramCount}`);
                params.push(currentUser.id);
                paramCount++;
            } else if (userId) {
                conditions.push(`v.user_id = $${paramCount}`);
                params.push(userId);
                paramCount++;
            }

            if (destinationId) {
                conditions.push(`v.destination_id = $${paramCount}`);
                params.push(destinationId);
                paramCount++;
            }

            if (countryId) {
                conditions.push(`c.id = $${paramCount}`);
                params.push(countryId);
                paramCount++;
            }

            if (continentId) {
                conditions.push(`cont.id = $${paramCount}`);
                params.push(continentId);
                paramCount++;
            }

            if (dateRange) {
                if (dateRange.start) {
                    conditions.push(`v.visited_at >= $${paramCount}`);
                    params.push(dateRange.start);
                    paramCount++;
                }
                if (dateRange.end) {
                    conditions.push(`v.visited_at <= $${paramCount}`);
                    params.push(dateRange.end);
                    paramCount++;
                }
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            if (orderBy) {
                switch (orderBy) {
                    case 'RATING_DESC':
                        query += ` ORDER BY v.rating DESC`;
                        break;
                    case 'RATING_ASC':
                        query += ` ORDER BY v.rating ASC`;
                        break;
                    case 'OLDEST':
                        query += ` ORDER BY v.visited_at ASC`;
                        break;
                    default:
                        query += ` ORDER BY v.visited_at DESC`;
                }
            } else {
                query += ` ORDER BY v.visited_at DESC`;
            }

            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await pgPool.query(query, params);

            // Get total count
            let countQuery = `
                SELECT COUNT(*) 
                FROM visits v
                JOIN destinations d ON d.id = v.destination_id
                JOIN countries c ON c.id = d.country_id
                JOIN continents cont ON cont.id = c.continent_id
            `;
            if (conditions.length > 0) {
                countQuery += ` WHERE ${conditions.join(' AND ')}`;
            }
            const totalCount = await pgPool.query(countQuery, params.slice(0, -2));

            return {
                items: result.rows,
                totalCount: parseInt(totalCount.rows[0].count),
                hasMore: offset + limit < parseInt(totalCount.rows[0].count)
            };
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
        /**
         * Records a new visit to a destination
         * 
         * Features:
         * - Creates visit record
         * - Updates destination statistics
         * - Updates user visit history
         * - Validates destination exists
         * 
         * @throws AuthenticationError if user not logged in
         * @throws UserInputError if destination doesn't exist
         * 
         * Example mutation:
         * mutation RecordVisit($input: CreateVisitInput!) {
         *   createVisit(input: $input) {
         *     id
         *     visited_at
         *     rating
         *     notes
         *     destination {
         *       name
         *       country {
         *         name
         *       }
         *     }
         *   }
         * }
         */
        createVisit: async (_, { input }, { pgPool, currentUser }) => {
            if (!currentUser) {
                throw new AuthenticationError('You must be logged in to record a visit');
            }

            const client = await pgPool.connect();
            try {
                await client.query('BEGIN');

                const destCheck = await client.query(
                    'SELECT id FROM destinations WHERE id = $1',
                    [input.destinationId]
                );

                if (destCheck.rows.length === 0) {
                    throw new UserInputError('Destination not found');
                }

                const visitResult = await client.query(`
                    INSERT INTO visits (
                        user_id,
                        destination_id,
                        visited_at
                    ) VALUES ($1, $2, $3)
                    RETURNING *
                `, [
                    currentUser.id,
                    input.destinationId,
                    input.visitedAt || new Date()
                ]);

                await client.query(`
                    UPDATE destinations
                    SET total_visits = total_visits + 1
                    WHERE id = $1
                `, [input.destinationId]);

                await client.query('COMMIT');

                const result = await pgPool.query(`
                    SELECT 
                        v.*,
                        d.name as destination_name,
                        c.name as country_name
                    FROM visits v
                    JOIN destinations d ON d.id = v.destination_id
                    JOIN countries c ON c.id = d.country_id
                    WHERE v.id = $1
                `, [visitResult.rows[0].id]);

                return result.rows[0];
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }
    },

    Visit: {
        user: async (parent, _, { pgPool, currentUser }) => {
            // Check authorization
            if (!currentUser || (parent.user_id !== currentUser.id && !currentUser.is_admin)) {
                throw new ForbiddenError('Not authorized to view user details');
            }

            const result = await pgPool.query(
                'SELECT * FROM users WHERE id = $1',
                [parent.user_id]
            );
            return result.rows[0];
        },

        destination: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM destinations WHERE id = $1',
                [parent.destination_id]
            );
            return result.rows[0];
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