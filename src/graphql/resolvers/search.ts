import { IResolvers } from '@graphql-tools/utils';
import { Context } from '../../types/context';

export const searchResolvers: IResolvers = {
  Query: {
    search: async (_parent: any, { query }: { query: string }, { searchService }: Context) => {
      return searchService.search(query);
    }
  }
}; 