import { IResolvers } from '@graphql-tools/utils';
import { DestinationService } from '../../services/destination.service';
import { Context } from '../../types/context';
import { Destination } from '../../types/destination';

export const destinationResolvers: IResolvers = {
    Query: {
        destinations: async (_, __, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getAll();
        },

        destination: async (_, { id }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getById(Number(id));
        },

        destinationsByCountry: async (_, { countryId }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getByCountry(Number(countryId));
        },

        destinationsByType: async (_, { typeId }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getByType(Number(typeId));
        },

        destinationVisitsByUser: async (_, { userId }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getVisitsByUser(Number(userId));
        },

        destinationVisitsByDestination: async (_, { destinationId }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getVisitsByDestination(Number(destinationId));
        },
    },

    Destination: {
        country: async (destination: Destination, _, { loaders }: Context) => {
            return loaders.countryLoader.load(destination.country_id);
        },

        type: async (destination: Destination, _, { loaders }: Context) => {
            return loaders.destinationTypeLoader.load(destination.type_id);
        },

        highlights: async (destination: Destination, _, { pgPool, loaders }: Context) => {
            const service = new DestinationService(pgPool);
            const highlightIds = await service.getHighlightIds(destination.id);
            return loaders.highlightLoader.loadMany(highlightIds);
        },

        visitStats: async (destination: Destination, _, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getVisitStats(destination.id);
        },
    },

    Mutation: {
        recordDestinationVisit: async (_, { userId, destinationId }, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.recordVisit(Number(userId), Number(destinationId));
        },
    },
};