import { IResolvers } from '@graphql-tools/utils';
import { CategoryService } from '../../services/category.service';
import { Context } from '../../types/context';
import { Category } from '../../types/category';

export const categoryResolvers: IResolvers = {
    Query: {
        category: async (_, { id }, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.findById(id);
        },

        categories: async (_, { filter, pagination, orderBy }, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.findAll({ filters: filter, pagination, orderBy });
        },

        searchCategories: async (_, { term }, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.search(term);
        },

        categoryStats: async (_, { id, period }, { pgPool }) => {
            const service = new CategoryService(pgPool);
            return service.getStats(id, period);
        },

        popularCategories: async (_, { limit = 10 }, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    dc.*,
                    COUNT(v.id) as visit_count
                FROM destination_categories dc
                LEFT JOIN destinations d ON d.category_id = dc.id
                LEFT JOIN visits v ON v.destination_id = d.id
                GROUP BY dc.id
                ORDER BY visit_count DESC
                LIMIT $1
            `, [limit]);
            return result.rows;
        }
    },

    Mutation: {
        createCategory: async (_, { input }, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.create(input);
        },

        updateCategory: async (_, { id, input }, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.update(id, input);
        },

        deleteCategory: async (_, { id }, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.delete(id);
        }
    },

    Category: {
        destinations: async (category: Category, _, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.getDestinations(category.id);
        },

        stats: async (category: Category, _, { pgPool }: Context) => {
            const service = new CategoryService(pgPool);
            return service.getStats(category.id);
        }
    }
}; 