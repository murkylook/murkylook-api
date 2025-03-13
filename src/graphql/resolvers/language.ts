import { IResolvers } from '@graphql-tools/utils';
import { LanguageService } from '../../services/language.service';
import { Context } from '../../types/context';

export const languageResolvers: IResolvers = {
  Query: {
    languages: async (_, __, { pgPool }: Context) => {
      const service = new LanguageService(pgPool);
      return service.getAll();
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