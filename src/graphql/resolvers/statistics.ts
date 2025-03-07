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
        periodComparison: async (_, { period = 'month' }, { pgPool, currentUser }) => {
            if (!currentUser?.is_admin) {
                throw new AuthenticationError('Only administrators can view period comparisons');
            }

            const result = await pgPool.query(`
                WITH current_period AS (
                    SELECT COUNT(*) as visits,
                           COUNT(DISTINCT user_id) as unique_visitors
                    FROM visits
                    WHERE visited_at >= date_trunc('${period}', NOW())
                ),
                previous_period AS (
                    SELECT COUNT(*) as visits,
                           COUNT(DISTINCT user_id) as unique_visitors
                    FROM visits
                    WHERE visited_at >= date_trunc('${period}', NOW() - interval '1 ${period}')
                    AND visited_at < date_trunc('${period}', NOW())
                )
                SELECT 
                    cp.visits as current_visits,
                    pp.visits as previous_visits,
                    cp.unique_visitors as current_unique_visitors,
                    pp.unique_visitors as previous_unique_visitors
                FROM current_period cp, previous_period pp
            `);

            return result.rows[0];
        },

        /**
         * Analyzes user engagement patterns
         * 
         * Features:
         * - Active user metrics
         * - Visit frequency
         * - User retention
         * - Engagement trends
         * 
         * Example query:
         * query UserEngagement {
         *   userEngagementStats {
         *     daily_active_users
         *     weekly_active_users
         *     monthly_active_users
         *     average_visits_per_user
         *     retention_rate
         *   }
         * }
         */
        userEngagementStats: async (_, __, { pgPool, currentUser }) => {
            if (!currentUser?.is_admin) {
                throw new AuthenticationError('Only administrators can view engagement statistics');
            }

            const result = await pgPool.query(`
                SELECT
                    (
                        SELECT COUNT(DISTINCT user_id) 
                        FROM visits 
                        WHERE visited_at >= NOW() - INTERVAL '1 day'
                    ) as daily_active_users,
                    (
                        SELECT COUNT(DISTINCT user_id) 
                        FROM visits 
                        WHERE visited_at >= NOW() - INTERVAL '7 days'
                    ) as weekly_active_users,
                    (
                        SELECT COUNT(DISTINCT user_id) 
                        FROM visits 
                        WHERE visited_at >= NOW() - INTERVAL '30 days'
                    ) as monthly_active_users,
                    (
                        SELECT COALESCE(AVG(visit_count), 0)
                        FROM (
                            SELECT COUNT(*) as visit_count
                            FROM visits
                            WHERE visited_at >= NOW() - INTERVAL '30 days'
                            GROUP BY user_id
                        ) as user_visits
                    ) as average_visits_per_user,
                    (
                        SELECT COALESCE(
                            COUNT(DISTINCT CASE WHEN visited_at >= NOW() - INTERVAL '30 days' THEN user_id END)::float / 
                            NULLIF(COUNT(DISTINCT CASE WHEN visited_at >= NOW() - INTERVAL '60 days' AND visited_at < NOW() - INTERVAL '30 days' THEN user_id END), 0) * 100,
                            0
                        )
                        FROM visits
                    ) as retention_rate
            `);

            return result.rows[0];
        }
    }
}; 