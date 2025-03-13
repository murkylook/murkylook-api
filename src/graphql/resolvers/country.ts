import { IResolvers } from '@graphql-tools/utils';
import { CountryService } from '../../services/country.service';
import { Context } from '../../types/context';
import { Country } from '../../types/country';

export const countryResolvers: IResolvers = {
    Query: {
        countryByIso: async (_, { isoCode }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.getByIso(isoCode);
        },
        countryById: async (_, { id }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.getById(Number(id));
        },
        countryByIso3: async (_, { iso3Code }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.getByIso3(iso3Code);
        },
        countryByName: async (_, { name }, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.getByName(name);
        },
        countries: async (_, __, { pgPool }: Context) => {
            const service = new CountryService(pgPool);
            return service.getAll();
        },
    },

    Country: {
        continent: async (country: Country, _, { loaders }: Context) => {
            return loaders.continentLoader.load(country.continent_id);
        },

        destinations: async (country: Country, _, { pgPool, loaders }: Context) => {
            const service = new CountryService(pgPool);
            const destinationIds = await service.getDestinationIds(country.id);
            return loaders.destinationLoader.loadMany(destinationIds);
        },
    }
}; 