import { IResolvers } from '@graphql-tools/utils';
import { DestinationService } from '../../services/destination.service';
import { Context } from '../../types/context';
import { Destination } from '../../types/destination';

export const destinationResolvers: IResolvers = {
    Query: {
        destination: async (_, { id }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.findById(id);
        },

        destinations: async (_, { filter, pagination, orderBy }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.findAll({ filters: filter, pagination, orderBy });
        },

        searchDestinations: async (_, { term }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.search(term);
        },

        nearbyDestinations: async (_, { latitude, longitude, radiusKm }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.findNearby(latitude, longitude, radiusKm);
        },

        destinationsByCountry: async (_, { countryId }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.findByCountry(countryId);
        },

        destinationsByContinent: async (_, { continentId }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.findByContinent(continentId);
        },

        featuredDestinations: async (_, __, { pgPool }) => {
            const result = await pgPool.query(`
                SELECT 
                    d.*,
                    d.image_url,
                    c.name as country_name,
                    c.abbreviation as country_abbrev,
                    cont.name as continent_name,
                    cont.abbreviation as continent_abbrev
                FROM destinations d
                JOIN countries c ON c.id = d.country_id
                JOIN continents cont ON cont.id = c.continent_id
                WHERE 
                    ((c.abbreviation = 'GBR' AND d.name = 'London') OR
                    (c.abbreviation = 'FRA' AND d.name = 'Paris') OR
                    (c.abbreviation = 'NLD' AND d.name = 'Amsterdam'))
                    AND d.hidden = false
                    AND c.hidden = false
                    AND cont.hidden = false
                GROUP BY d.id, c.name, c.abbreviation, cont.name, cont.abbreviation
                ORDER BY d.name
            `);
            return result.rows;
        },

        destinationStats: async (_, { id, _period }, { pgPool }) => {
            const service = new DestinationService(pgPool);
            return service.getStats(id);
        }
    },

    Mutation: {
        createDestination: async (_, { input }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.create(input);
        },

        updateDestination: async (_, { id, input }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.update(id, input);
        },

        deleteDestination: async (_, { id }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.delete(id);
        },

        updateDestinationCategories: async (_, { id, categoryIds }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            await service.updateCategories(id, categoryIds);
            return service.findById(id);
        }
    },

    Destination: {
        country: async (destination: Destination, _, { loaders }: Context) => {
            return loaders.countryLoader.load(destination.country_id);
        },

        categories: async (destination: Destination, _, { loaders }: Context) => {
            if (!destination.category_id) return [];
            return [await loaders.categoryLoader.load(destination.category_id)];
        },

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
        },

        stats: async (destination: Destination, _, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getStats(destination.id);
        },
    }
}; 