import { IResolvers } from '@graphql-tools/utils';

export const categoryResolvers: IResolvers = {
    Query: {
        categories: async (_, __, { pgPool }) => {
            const result = await pgPool.query('SELECT * FROM destination_categories');
            return result.rows;
        },

        category: async (_, { id }, { pgPool }) => {
            const result = await pgPool.query('SELECT * FROM destination_categories WHERE id = $1', [id]);
            return result.rows[0];
        },

        categoryStats: async (_, { id, period }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    COUNT(DISTINCT d.id) as total_destinations,
                    COUNT(v.id) as total_visits,
                    json_agg(
                        json_build_object(
                            'period', date_trunc('${period.period}', v.visited_at),
                            'count', COUNT(v.id)
                        )
                    ) as visitsByPeriod
                FROM destination_categories c
                LEFT JOIN destinations d ON d.category_id = c.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1
                GROUP BY c.id
            `, [id]);
            return result.rows[0];
        },

        popularCategories: async (_, { limit = 10 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT c.*, COUNT(v.id) as visit_count
                FROM destination_categories c
                LEFT JOIN destinations d ON d.category_id = c.id
                LEFT JOIN visits v ON v.destination_id = d.id
                GROUP BY c.id
                ORDER BY visit_count DESC
                LIMIT $1
            `, [limit]);
            return result.rows;
        }
    },

    DestinationCategory: {
        destinations: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM destinations WHERE category_id = $1',
                [parent.id]
            );
            return result.rows;
        },

        statistics: async (parent, { period = { period: 'month', count: 12 } }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    COUNT(DISTINCT d.id) as total_destinations,
                    COUNT(v.id) as total_visits,
                    json_agg(
                        json_build_object(
                            'period', date_trunc('${period.period}', v.visited_at),
                            'count', COUNT(v.id)
                        )
                    ) as visitsByPeriod
                FROM destination_categories c
                LEFT JOIN destinations d ON d.category_id = c.id
                LEFT JOIN visits v ON v.destination_id = d.id
                WHERE c.id = $1
                GROUP BY c.id
            `, [parent.id]);
            return result.rows[0];
        }
    }
}; 