/**
 * Country Resolver
 * Handles all country-related queries and field resolvers
 * 
 * Key features:
 * - Country information management
 * - Relationship handling (continent, destinations)
 * - Statistical analysis
 * - Geographic data organization
 * 
 * Database relationships:
 * - Belongs to one Continent
 * - Has many Destinations
 * - Has many Visits (through Destinations)
 */

import { IResolvers } from '@graphql-tools/utils';

export const countryResolvers: IResolvers = {
    Query: {
        /**
         * Fetches a single country by ID with full details
         * 
         * Features:
         * - Basic country information
         * - Aggregated destination counts
         * - Visit statistics
         * - Continental context
         * 
         * Example query:
         * query GetCountry($id: ID!) {
         *   country(id: $id) {
         *     id
         *     name
         *     continent {
         *       name
         *     }
         *     total_destinations
         *     total_visits
         *     destinations(limit: 5) {
         *       name
         *     }
         *   }
         * }
         * 
         * @param id - Country ID
         * @returns Country object with full details
         */
        country: async (_, { abbreviation }, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM countries WHERE abbreviation = $1',
                [abbreviation]
            );
            return result.rows[0];
        },

        /**
         * Lists countries with comprehensive filtering and search
         * 
         * Filter options:
         * - Text search (name)
         * - By continent
         * - By destination count
         * - By visit count
         * 
         * Features:
         * - Pagination
         * - Multiple sorting options
         * - Statistical aggregations
         * 
         * Example query:
         * query ListCountries(
         *   $searchTerm: String
         *   $continentId: ID
         *   $orderBy: CountryOrderBy
         * ) {
         *   countries(
         *     searchTerm: $searchTerm
         *     continentId: $continentId
         *     orderBy: $orderBy
         *   ) {
         *     items {
         *       id
         *       name
         *       total_destinations
         *       total_visits
         *     }
         *     totalCount
         *     hasMore
         *   }
         * }
         */
        countries: async (_, { searchTerm, orderBy }, { pgPool }) => {
            let query = 'SELECT * FROM countries';
            const params = [];

            if (searchTerm) {
                query += ' WHERE name ILIKE $1';
                params.push(`%${searchTerm}%`);
            }

            if (orderBy) {
                switch (orderBy) {
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
         * Provides detailed statistics for a country
         * 
         * Statistics include:
         * - Total destinations and visits
         * - Visit trends over time
         * - Popular destinations
         * 
         * Example query:
         * query CountryStats($id: ID!, $period: PeriodInput!) {
         *   countryStats(id: $id, period: $period) {
         *     total_visits
         *     total_destinations
         *     visitsByPeriod {
         *       period
         *       count
         *     }
         *     topDestinations {
         *       name
         *     }
         *   }
         * }
         */
        countryStats: async (_, { id, period }, { pgPool }) => {
            const basicStats = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT v.id) as total_visits,
                    COUNT(DISTINCT d.id) as total_destinations
                FROM countries c
                LEFT JOIN destinations d ON d.country_id = c.id
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
                WHERE d.country_id = $2
                GROUP BY period
                ORDER BY period DESC
                LIMIT $3
            `, [period.period, id, period.count]);

            const topDestinations = await pgPool.query(`
                SELECT 
                    d.*,
                    COUNT(v.id) as visit_count
                FROM destinations d
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE d.country_id = $1
                GROUP BY d.id
                ORDER BY visit_count DESC
                LIMIT 5
            `, [id]);

            return {
                ...basicStats.rows[0],
                visitsByPeriod: visitsByPeriod.rows,
                topDestinations: topDestinations.rows
            };
        },

        /**
         * Lists countries ordered by visit count
         * Useful for discovering popular travel destinations
         * 
         * Example query:
         * query TopCountries($limit: Int) {
         *   topCountriesByVisits(limit: $limit) {
         *     id
         *     name
         *     visit_count
         *   }
         * }
         */
        topCountriesByVisits: async (_, { limit = 10 }, { pgPool }) => {
            const result = await pgPool.query(`
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
    },

    Country: {
        /**
         * Resolves the continent relationship
         * Returns the continent this country belongs to
         */
        continent: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM continents WHERE id = $1',
                [parent.continent_id]
            );
            return result.rows[0];
        },

        /**
         * Resolves the destinations relationship
         * Returns paginated list of destinations in this country
         */
        destinations: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM destinations WHERE country_id = $1',
                [parent.id]
            );
            return result.rows;
        },

        /**
         * Resolves country statistics
         * Provides aggregated metrics about the country
         */
        statistics: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    COUNT(DISTINCT d.id) as total_destinations,
                    COUNT(DISTINCT v.id) as total_visits
                FROM countries c
                LEFT JOIN destinations d ON d.country_id = c.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1
                GROUP BY c.id
            `, [parent.id]);
            return result.rows[0];
        }
    }
}; 