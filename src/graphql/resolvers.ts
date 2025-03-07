import { IResolvers } from '@graphql-tools/utils';

export const resolvers: IResolvers = {
    Query: {
        // Continent resolvers
        continent: async (_, { id }, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM continents WHERE id = $1',
                [id]
            );
            return result.rows[0];
        },
        continents: async (_, __, { pgPool }) => {
            const result = await pgPool.query('SELECT * FROM continents');
            return result.rows;
        },

        // Country resolvers
        country: async (_, { id }, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM countries WHERE id = $1',
                [id]
            );
            return result.rows[0];
        },
        countries: async (_, __, { pgPool }) => {
            const result = await pgPool.query('SELECT * FROM countries');
            return result.rows;
        },

        // Destination resolvers
        destination: async (_, { id }, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM destinations WHERE id = $1',
                [id]
            );
            return result.rows[0];
        },
        destinations: async (_, { limit, offset, categoryId, countryId }, { pgPool }) => {
            let query = 'SELECT * FROM destinations';
            const params = [];
            const conditions = [];

            if (categoryId) {
                params.push(categoryId);
                conditions.push(`category_id = $${params.length}`);
            }

            if (countryId) {
                params.push(countryId);
                conditions.push(`country_id = $${params.length}`);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(limit, offset);

            const result = await pgPool.query(query, params);
            return result.rows;
        },

        // Category resolvers
        destinationCategories: async (_, __, { pgPool }) => {
            const result = await pgPool.query('SELECT * FROM destination_categories');
            return result.rows;
        },
    },

    // Field resolvers
    Continent: {
        countries: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM countries WHERE continent_id = $1',
                [parent.id]
            );
            return result.rows;
        },
    },

    Country: {
        continent: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM continents WHERE id = $1',
                [parent.continent_id]
            );
            return result.rows[0];
        },
        destinations: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM destinations WHERE country_id = $1',
                [parent.id]
            );
            return result.rows;
        },
    },

    Destination: {
        country: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM countries WHERE id = $1',
                [parent.country_id]
            );
            return result.rows[0];
        },
        category: async (parent, _, { pgPool }) => {
            const result = await pgPool.query(
                'SELECT * FROM destination_categories WHERE id = $1',
                [parent.category_id]
            );
            return result.rows[0];
        },
    },
}; 