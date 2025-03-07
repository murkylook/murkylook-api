/**
 * Statistics Resolver
 * Handles all analytics and statistical queries across the application
 * 
 * Key features:
 * - Global statistics aggregation
 * - Trend analysis
 * - Period-based comparisons
 * - Performance metrics
 * - User engagement analytics
 * 
 * Common use cases:
 * - Dashboard analytics
 * - Trend reporting
 * - User behavior analysis
 * - Travel pattern insights
 */

import { IResolvers } from '@graphql-tools/utils';
import { AuthenticationError } from 'apollo-server-express';

export const statisticsResolvers: IResolvers = {
    Query: {
        /**
         * Provides comprehensive global statistics across all entities
         * 
         * Features:
         * - Total counts for all entities
         * - Average ratings
         * - Global engagement metrics
         * - System-wide statistics
         * 
         * Authorization:
         * - Admin only endpoint
         * 
         * Example query:
         * query GetGlobalStats {
         *   globalStatistics {
         *     total_users
         *     total_continents
         *     total_countries
         *     total_destinations
         *     total_visits
         *     average_destination_rating
         *     average_visit_rating
         *   }
         * }
         * 
         * @throws AuthenticationError if not admin
         */
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

        /**
         * Analyzes trending destinations and travel patterns
         * 
         * Features:
         * - Popular destinations
         * - Visit frequency
         * - Rating trends
         * - Geographic hotspots
         * 
         * Example query:
         * query GetTrendingStats($days: Int) {
         *   trendingStatistics(days: $days) {
         *     id
         *     name
         *     country_name
         *     visit_count
         *     average_rating
         *   }
         * }
         */
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

        /**
         * Compares statistics between two time periods
         * 
         * Features:
         * - Period-over-period comparison
         * - Growth metrics
         * - Engagement changes
         * - Performance trends
         * 
         * Example query:
         * query ComparePeriods($period: String!) {
         *   periodComparison(period: $period) {
         *     current_visits
         *     previous_visits
         *     current_unique_visitors
         *     previous_unique_visitors
         *     current_avg_rating
         *     previous_avg_rating
         *     growth_percentage
         *   }
         * }
         */
    }
}; 