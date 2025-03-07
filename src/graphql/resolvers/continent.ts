/**
 * Continent Resolver
 * Handles all continent-related queries and field resolvers
 * 
 * Key features:
 * - Continent information management
 * - Geographic hierarchy (countries, destinations)
 * - Statistical aggregation
 * - Visit tracking at continental level
 * 
 * Database relationships:
 * - Has many Countries
 * - Has many Destinations (through Countries)
 * - Has many Visits (through Destinations)
 * 
 * Common use cases:
 * - Regional statistics
 * - Geographic grouping
 * - Travel trend analysis
 * - Regional popularity tracking
 */

import { IResolvers } from '@graphql-tools/utils';

export const continentResolvers: IResolvers = {
    Query: {
        /**
         * Fetches a single continent by abbreviation with full details
         * 
         * Features:
         * - Basic continent information
         * - Aggregated country counts
         * - Total destinations in region
         * - Visit statistics
         * 
         * Example query:
         * query GetContinent($abbreviation: String!) {
         *   continent(abbreviation: $abbreviation) {
         *     id
         *     name
         *     total_countries
         *     total_destinations
         *     total_visits
         *     countries {
         *       name
         *       total_destinations
         *     }
         *   }
         * }
         * 
         * @param abbreviation - Continent abbreviation (e.g., 'EU', 'AS', 'NA')
         * @returns Continent object with full details
         */
        continent: async (_, { abbreviation }, { pgPool }) => {
            console.log('=== Continent Resolver Called ===');
            console.log('Parameters:', { abbreviation });
            console.log('Context:', { pgPool: !!pgPool });
            const result = await pgPool.query(
                'SELECT * FROM continents WHERE abbreviation = $1',
                [abbreviation]
            );
            return result.rows[0];
        },

        /**
         * Lists continents with search and filtering capabilities
         * 
         * Features:
         * - Text search on name
         * - Multiple sorting options
         * - Statistical aggregations
         * - Visit metrics
         * 
         * Example query:
         * query ListContinents(
         *   $searchTerm: String
         *   $orderBy: ContinentOrderBy
         * ) {
         *   continents(
         *     searchTerm: $searchTerm
         *     orderBy: $orderBy
         *   ) {
         *     id
         *     name
         *     total_countries
         *     total_destinations
         *     total_visits
         *   }
         * }
         */
        continents: async (_, { searchTerm, orderBy }, { pgPool }) => {
            console.log('=== Continents List Resolver Called ===');
            console.log('Parameters:', { searchTerm, orderBy });
            
            let query = 'SELECT * FROM continents';
            const params = [];

            if (searchTerm) {
                query += ' WHERE name ILIKE $1';
                params.push(`%${searchTerm}%`);
            }

            if (orderBy) {
                switch (orderBy) {
                    case 'COUNTRIES_DESC':
                        query += ' ORDER BY total_countries DESC';
                        break;
                    case 'DESTINATIONS_DESC':
                        query += ' ORDER BY total_destinations DESC';
                        break;
                    case 'VISITS_DESC':
                        query += ' ORDER BY total_visits DESC';
                        break;
                    default:
                        query += ' ORDER BY name';
                }
            } else {
                query += ' ORDER BY name';
            }

            const result = await pgPool.query(query, params);
            return result.rows;
        },

        /**
         * Provides detailed statistics for a continent
         * 
         * Statistics include:
         * - Total countries and destinations
         * - Visit trends over time
         * - Popular countries
         * - Regional activity patterns
         * 
         * Example query:
         * query ContinentStats($id: ID!, $period: PeriodInput!) {
         *   continentStats(id: $id, period: $period) {
         *     total_visits
         *     total_destinations
         *     total_countries
         *     visitsByPeriod {
         *       period
         *       count
         *     }
         *   }
         * }
         */
        continentStats: async (_, { id, period }, { pgPool }) => {
            const basicStats = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT v.id) as total_visits,
                    COUNT(DISTINCT d.id) as total_destinations,
                    COUNT(DISTINCT co.id) as total_countries
                FROM continents c
                LEFT JOIN countries co ON co.continent_id = c.id
                LEFT JOIN destinations d ON d.country_id = co.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1
                GROUP BY c.id
            `, [id]);

            const visitsByPeriod = await pgPool.query(`
                SELECT 
                    DATE_TRUNC($1, v.visited_at) as period,
                    COUNT(*) as count
                FROM visits v
                JOIN destinations d ON d.id = v.destination_id
                JOIN countries co ON co.id = d.country_id
                WHERE co.continent_id = $2
                GROUP BY period
                ORDER BY period DESC
                LIMIT $3
            `, [period.period, id, period.count]);

            return {
                ...basicStats.rows[0],
                visitsByPeriod: visitsByPeriod.rows
            };
        },

        /**
         * Lists continents ordered by visit count
         * Useful for analyzing global travel patterns
         * 
         * Example query:
         * query PopularContinents($limit: Int) {
         *   topContinentsByVisits(limit: $limit) {
         *     id
         *     name
         *     visit_count
         *   }
         * }
         */
        topContinentsByVisits: async (_, { limit }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(v.id) as visit_count
                FROM continents c
                LEFT JOIN countries co ON co.continent_id = c.id
                LEFT JOIN destinations d ON d.country_id = co.id
                LEFT JOIN visits v ON v.destination_id = d.id
                GROUP BY c.id
                ORDER BY visit_count DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        }
    },

    Continent: {
        /**
         * Resolves the countries relationship
         * Returns all countries within this continent
         * 
         * Features:
         * - Ordered by name
         * - Includes country statistics
         * - Destination counts
         */
        countries: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT d.id) as total_destinations,
                    COUNT(DISTINCT v.id) as total_visits
                FROM countries c
                LEFT JOIN destinations d ON d.country_id = c.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.continent_id = $1
                GROUP BY c.id
                ORDER BY c.name
            `, [parent.id]);
            return result.rows;
        },

        /**
         * Resolves aggregated statistics for the continent
         * Provides quick access to key metrics
         */
        statistics: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    COUNT(DISTINCT co.id) as total_countries,
                    COUNT(DISTINCT d.id) as total_destinations,
                    COUNT(DISTINCT v.id) as total_visits
                FROM continents c
                LEFT JOIN countries co ON co.continent_id = c.id
                LEFT JOIN destinations d ON d.country_id = co.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1
                GROUP BY c.id
            `, [parent.id]);
            return result.rows[0];
        }
    }
}; 