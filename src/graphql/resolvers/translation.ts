import { IResolvers } from '@graphql-tools/utils';
import { TranslationService } from '../../services/translation.service';
import { Context } from '../../types/context';

export const translationResolvers: IResolvers = {
  Query: {
    translations: async (_, __, { pgPool }: Context) => {
      const service = new TranslationService(pgPool);
      return service.getAll();
    },

    translation: async (_, { id }, { pgPool }: Context) => {
      const service = new TranslationService(pgPool);
      return service.getById(Number(id));
    },

    translationsByLanguage: async (_, { languageId }, { pgPool }: Context) => {
      const service = new TranslationService(pgPool);
      return service.getByLanguage(Number(languageId));
    },

    translationsByTableAndRow: async (_, { tableName, rowId }, { pgPool }: Context) => {
      const service = new TranslationService(pgPool);
      return service.getByTableAndRow(tableName, Number(rowId));
    },

    translationsByTableRowAndColumn: async (_, { tableName, rowId, columnName }, { pgPool }: Context) => {
      const service = new TranslationService(pgPool);
      return service.getByTableRowAndColumn(tableName, Number(rowId), columnName);
    },

    translationByTableRowColumnAndLanguage: async (
      _, 
      { tableName, rowId, columnName, languageId }, 
      { pgPool }: Context
    ) => {
      const service = new TranslationService(pgPool);
      return service.getByTableRowColumnAndLanguage(
        tableName, 
        Number(rowId), 
        columnName, 
        Number(languageId)
      );
    },
  },

  Translation: {
    language: async (translation, _, { loaders }: Context) => {
      return loaders.languageLoader.load(translation.language_id);
    },
  },
}; 