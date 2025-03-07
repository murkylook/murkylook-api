import { IResolvers } from '@graphql-tools/utils';

export const categoryResolvers: IResolvers = {
    Query: {
        category: async (_, { id }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT dc.destination_id) as total_destinations,
                    COUNT(DISTINCT v.id) as total_visits
                FROM categories c
                LEFT JOIN destination_categories dc ON dc.category_id = c.id
                LEFT JOIN visits v ON v.destination_id = dc.destination_id
                WHERE c.id = $1
                GROUP BY c.id
            `, [id]);
            return result.rows[0];
        },

        categories: async (_, { 
            searchTerm,
            orderBy,
            limit = 10,
            offset = 0 
        }, { pgPool }) => {
            let query = `
                SELECT 
                    c.*,
                    COUNT(DISTINCT dc.destination_id) as destination_count,
                    COUNT(DISTINCT v.id) as visit_count
                FROM categories c
                LEFT JOIN destination_categories dc ON dc.category_id = c.id
                LEFT JOIN visits v ON v.destination_id = dc.destination_id
            `;

            const params = [];
            let paramCount = 1;

            if (searchTerm) {
                query += ` WHERE c.name ILIKE $${paramCount} OR c.description ILIKE $${paramCount}`;
                params.push(`%${searchTerm}%`);
                paramCount++;
            }

            query += ` GROUP BY c.id`;

            if (orderBy) {
                switch (orderBy) {
                    case 'DESTINATIONS_DESC':
                        query += ` ORDER BY destination_count DESC`;
                        break;
                    case 'VISITS_DESC':
                        query += ` ORDER BY visit_count DESC`;
                        break;
                    case 'RECENTLY_ADDED':
                        query += ` ORDER BY c.created_at DESC`;
                        break;
                    default:
                        query += ` ORDER BY c.name`;
                }
            } else {
                query += ` ORDER BY c.name`;
            }

            query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            params.push(limit, offset);

            const result = await pgPool.query(query, params);

            // Get total count
            let countQuery = `SELECT COUNT(*) FROM categories`;
            if (searchTerm) {
                countQuery += ` WHERE name ILIKE $1 OR description ILIKE $1`;
            }
            const totalCount = await pgPool.query(countQuery, searchTerm ? [`%${searchTerm}%`] : []);

            const response = {
                items: result.rows,
                totalCount: parseInt(totalCount.rows[0].count),
                hasMore: offset + limit < parseInt(totalCount.rows[0].count)
            };

            return response;
        },

        categoryStats: async (_, { id, period }, { pgPool }) => {
            // Get basic stats
            const basicStats = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT dc.destination_id) as total_destinations,
                    COUNT(DISTINCT v.id) as total_visits,
                    COALESCE(AVG(d.rating), 0) as average_destination_rating
                FROM categories c
                LEFT JOIN destination_categories dc ON dc.category_id = c.id
                LEFT JOIN destinations d ON d.id = dc.destination_id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1
                GROUP BY c.id
            `, [id]);

            // Get visits by period
            const visitsByPeriod = await pgPool.query(`
                SELECT 
                    DATE_TRUNC($1, v.visited_at) as period,
                    COUNT(*) as visit_count,
                    COUNT(DISTINCT v.destination_id) as unique_destinations,
                    COALESCE(AVG(v.rating), 0) as average_rating
                FROM visits v
                JOIN destination_categories dc ON dc.destination_id = v.destination_id
                WHERE dc.category_id = $2
                GROUP BY period
                ORDER BY period DESC
                LIMIT $3
            `, [period.period, id, period.count]);

            // Get top destinations in category
            const topDestinations = await pgPool.query(`
                SELECT 
                    d.*,
                    COUNT(v.id) as visit_count,
                    COALESCE(AVG(v.rating), 0) as average_rating
                FROM destinations d
                JOIN destination_categories dc ON dc.destination_id = d.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE dc.category_id = $1
                GROUP BY d.id
                ORDER BY visit_count DESC
                LIMIT 5
            `, [id]);

            const response = {
                ...basicStats.rows[0],
                visitsByPeriod: visitsByPeriod.rows,
                topDestinations: topDestinations.rows
            };

            return response;
        },

        popularCategories: async (_, { limit = 5 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT v.id) as visit_count,
                    COUNT(DISTINCT dc.destination_id) as destination_count
                FROM categories c
                LEFT JOIN destination_categories dc ON dc.category_id = c.id
                LEFT JOIN visits v ON v.destination_id = dc.destination_id
                GROUP BY c.id
                ORDER BY visit_count DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        }
    },

    Category: {
        destinations: async (parent, { limit = 10, offset = 0 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT d.* 
                FROM destinations d
                JOIN destination_categories dc ON dc.destination_id = d.id
                WHERE dc.category_id = $1
                ORDER BY d.name
                LIMIT $2 OFFSET $3
            `, [parent.id, limit, offset]);
            return result.rows;
        },

        relatedCategories: async (parent, { limit = 5 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    c.*,
                    COUNT(DISTINCT d.id) as common_destinations
                FROM categories c
                JOIN destination_categories dc1 ON dc1.category_id = c.id
                JOIN destination_categories dc2 ON dc2.destination_id = dc1.destination_id
                JOIN destinations d ON d.id = dc1.destination_id
                WHERE dc2.category_id = $1 AND c.id != $1
                GROUP BY c.id
                ORDER BY common_destinations DESC
                LIMIT $2
            `, [parent.id, limit]);
            return result.rows;
        }
    }
}; 