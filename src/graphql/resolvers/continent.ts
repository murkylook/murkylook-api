import { IResolvers } from '@graphql-tools/utils';
import { ContinentService } from '../../services/continent.service';
import { Context } from '../../types/context';
import { Continent } from '../../types/continent';

export const continentResolvers: IResolvers = {
    Query: {
        continentByCode: async (_, { code }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.getByCode(code);
        },

        continentById: async (_, { id }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.getById(Number(id));
        },

        continents: async (_, __, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.getAll();
        },

        continentBySlug: async (_, { slug }, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.getBySlug(slug);
        },
    },

    Continent: {
        countries: async (continent: Continent, _, { pgPool }: Context) => {
            const service = new ContinentService(pgPool);
            return service.getCountries(continent.id);
        },
    }
}; 