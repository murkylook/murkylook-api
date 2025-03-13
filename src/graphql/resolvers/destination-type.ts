import { IResolvers } from '@graphql-tools/utils';
import { DestinationTypeService } from '../../services/destination-type.service';
import { Context } from '../../types/context';
import { DestinationType } from '../../types/destination-type';

export const destinationTypeResolvers: IResolvers = {
    Query: {
        destinationTypes: async (_, __, { pgPool }: Context) => {
            const service = new DestinationTypeService(pgPool);
            return service.getAll();
        },

        destinationType: async (_, { id }, { pgPool }: Context) => {
            const service = new DestinationTypeService(pgPool);
            return service.getById(Number(id));
        },

        destinationTypeByName: async (_, { name }, { pgPool }: Context) => {
            const service = new DestinationTypeService(pgPool);
            return service.getByName(name);
        },
    },

    DestinationType: {
        destinations: async (type: DestinationType, _, { pgPool, loaders }: Context) => {
            const service = new DestinationTypeService(pgPool);
            const destinationIds = await service.getDestinationIds(type.id);
            return loaders.destinationLoader.loadMany(destinationIds);
        },
    }
};