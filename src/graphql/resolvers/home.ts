import { IResolvers } from '@graphql-tools/utils';
import { HomeService } from '../../services/home.service';
import { Context } from '../../types/context';

export const homeResolvers: IResolvers = {
  Query: {
    stats: async (_, __, { pgPool }: Context) => {
      const service = new HomeService(pgPool);
      return service.getStats();
    },

    activeStats: async (_, __, { pgPool }: Context) => {
      const service = new HomeService(pgPool);
      return service.getActiveStats();
    },

    featuredDestinations: async (_, __, { pgPool }: Context) => {
      const service = new HomeService(pgPool);
      return service.getFeaturedDestinations();
    },
  },
}; 