import { IResolvers } from '@graphql-tools/utils';
import { LanguageService } from '../../services/language.service';
import { Context } from '../../types/context';

export const languageResolvers: IResolvers = {
  Query: {
    languages: async (_, __, { pgPool }: Context) => {
      try {
        const service = new LanguageService(pgPool);
        const languages = await service.getAll();
        return languages || [];
      } catch (error) {
        console.error('Error fetching languages:', error);
        return [];
      }
    },

    language: async (_, { id }, { pgPool }: Context) => {
      const service = new LanguageService(pgPool);
      return service.getById(Number(id));
    },

    languageByCode: async (_, { code }, { pgPool }: Context) => {
      const service = new LanguageService(pgPool);
      return service.getByCode(code);
    },
  },
}; 