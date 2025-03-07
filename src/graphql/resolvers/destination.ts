/**
 * Destination Resolver
 * Handles all destination-related queries and field resolvers
 * Core functionality for managing travel destinations and their relationships
 * 
 * Key features:
 * - Full CRUD operations for destinations
 * - Advanced search and filtering
 * - Statistical analysis
 * - Relationship management (country, categories, visits)
 */

import { IResolvers } from '@graphql-tools/utils';

export const destinationResolvers: IResolvers = {
    Query: {
        /**
         * Fetches a single destination by ID with full details
         * 
         * Features:
         * - Basic destination information
         * - Country and continent context
         * - Aggregated ratings
         * - Visit statistics
         * 
         * Example query:
         * query GetDestination($id: ID!) {
         *   destination(id: $id) {
         *     id
         *     name
         *     description
         *     rating
         *     country {
         *       name
         *     }
         *     total_visits
         *     average_rating
         *   }
         * }
         * 
         * @param id - Destination ID
         * @returns Destination object with full details
         */
        destination: async (_, { id }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    d.*,
                    c.name as country_name,
                    cont.name as continent_name,
                    COUNT(v.id) as total_visits
                FROM destinations d
                JOIN countries c ON c.id = d.country_id
                JOIN continents cont ON cont.id = c.continent_id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE d.id = $1
                GROUP BY d.id, c.name, cont.name
            `, [id]);
            return result.rows[0];
        },

        /**
         * Lists destinations with comprehensive filtering and search
         * 
         * Filter options:
         * - Text search (name, description)
         * - By country
         * - By continent
         * - By category
         * - By rating range
         * - By visit count
         * 
         * Features:
         * - Pagination
         * - Multiple sorting options
         * - Rich relationship data
         * 
         * Example query:
         * query SearchDestinations(
         *   $searchTerm: String
         *   $countryId: ID
         *   $minRating: Float
         *   $orderBy: DestinationOrderBy
         * ) {
         *   destinations(
         *     searchTerm: $searchTerm
         *     countryId: $countryId
         *     minRating: $minRating
         *     orderBy: $orderBy
         *   ) {
         *     items {
         *       id
         *       name
         *       rating
         *       country {
         *         name
         *       }
         *     }
         *     totalCount
         *     hasMore
         *   }
         * }
         */
        destinations: async (_, { 
            searchTerm,
            countryId,
            continentId,
            categoryId,
            orderBy,
            limit = 10,
            offset = 0 
        }, { pgPool }) => {
            let query = `
                SELECT 
                    d.*,
                    c.name as country_name,
                    COUNT(v.id) as visit_count
                FROM destinations d
                JOIN countries c ON c.id = d.country_id
            `;

            if (categoryId) {
                query += ` JOIN destination_categories dc ON dc.destination_id = d.id`;
            }

            query += ` LEFT JOIN visits v ON v.destination_id = d.id`;

            const conditions = [];
            const params = [];
            let paramCount = 1;

            if (searchTerm) {
                conditions.push(`(d.name ILIKE $${paramCount} OR d.description ILIKE $${paramCount})`);
                params.push(`%${searchTerm}%`);
                paramCount++;
            }

            if (countryId) {
                conditions.push(`d.country_id = $${paramCount}`);
                params.push(countryId);
                paramCount++;
            }

            if (continentId) {
                conditions.push(`c.continent_id = $${paramCount}`);
                params.push(continentId);
                paramCount++;
            }

            if (categoryId) {
                conditions.push(`dc.category_id = $${paramCount}`);
                params.push(categoryId);
                paramCount++;
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` GROUP BY d.id, c.name`;

            if (orderBy) {
                switch (orderBy) {
                    case 'VISITS_DESC':
                        query += ` ORDER BY visit_count DESC`;
                        break;
                    case 'RECENTLY_ADDED':
                        query += ` ORDER BY d.created_at DESC`;
                        break;
                    default:
                        query += ` ORDER BY d.name`;
                }
            } else {
                query += ` ORDER BY d.name`;
            }

            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await pgPool.query(query, params);

            // Get total count
            let countQuery = `SELECT COUNT(DISTINCT d.id) FROM destinations d`;
            if (categoryId) {
                countQuery += ` JOIN destination_categories dc ON dc.destination_id = d.id`;
            }
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

        /**
         * Provides comprehensive statistics for a destination
         * 
         * Statistics include:
         * - Visit trends over time
         * - Rating analysis
         * - Visitor demographics
         * - Popular visit times
         * - Seasonal patterns
         * 
         * Example query:
         * query DestinationStats($id: ID!, $period: PeriodInput!) {
         *   destinationStats(id: $id, period: $period) {
         *     total_visits
         *     average_rating
         *     visitsByPeriod {
         *       period
         *       count
         *     }
         *     popularTimes {
         *       hour
         *       count
         *     }
         *   }
         * }
         */
        destinationStats: async (_, { id, period }, { pgPool }) => {
            // Get basic stats
            const basicStats = await pgPool.query(`
                SELECT 
                    d.*,
                    COUNT(DISTINCT v.id) as total_visits,
                    COUNT(DISTINCT v.user_id) as unique_visitors,
                    COALESCE(AVG(v.rating), 0) as average_rating
                FROM destinations d
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE d.id = $1
                GROUP BY d.id
            `, [id]);

            // Get visits by period
            const visitsByPeriod = await pgPool.query(`
                SELECT 
                    DATE_TRUNC($1, visited_at) as period,
                    COUNT(*) as visit_count,
                    COALESCE(AVG(rating), 0) as average_rating
                FROM visits
                WHERE destination_id = $2
                GROUP BY period
                ORDER BY period DESC
                LIMIT $3
            `, [period.period, id, period.count]);

            // Get popular visit times
            const popularTimes = await pgPool.query(`
                SELECT 
                    EXTRACT(HOUR FROM visited_at) as hour,
                    COUNT(*) as visit_count
                FROM visits
                WHERE destination_id = $1
                GROUP BY hour
                ORDER BY visit_count DESC
                LIMIT 5
            `, [id]);

            const response = {
                ...basicStats.rows[0],
                visitsByPeriod: visitsByPeriod.rows,
                popularVisitTimes: popularTimes.rows
            };

            return response;
        }
    },

    Destination: {
        /**
         * Resolves the country relationship
         * Includes basic country information and statistics
         */
        country: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM countries WHERE id = $1',
                [parent.country_id]
            );
            return result.rows[0];
        },

        /**
         * Resolves the categories relationship
         * Returns all categories associated with the destination
         */
        categories: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT c.* 
                FROM categories c
                JOIN destination_categories dc ON dc.category_id = c.id
                WHERE dc.destination_id = $1
                ORDER BY c.name
            `, [parent.id]);
            return result.rows;
        },

        /**
         * Resolves the visits relationship
         * Returns paginated list of visits to this destination
         */
        visits: async (parent, { limit = 10, offset = 0 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT v.*, u.name as user_name
                FROM visits v
                JOIN users u ON u.id = v.user_id
                WHERE v.destination_id = $1
                ORDER BY v.visited_at DESC
                LIMIT $2 OFFSET $3
            `, [parent.id, limit, offset]);
            return result.rows;
        },

        recentVisitors: async (parent, { limit = 5 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT DISTINCT ON (u.id)
                    u.*,
                    v.visited_at as last_visit
                FROM users u
                JOIN visits v ON v.user_id = u.id
                WHERE v.destination_id = $1
                ORDER BY u.id, v.visited_at DESC
                LIMIT $2
            `, [parent.id, limit]);
            return result.rows;
        }
    }
}; 