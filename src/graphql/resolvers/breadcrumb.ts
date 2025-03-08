import { IResolvers } from '@graphql-tools/utils';
import { BreadcrumbService } from '../../services/breadcrumb.service';
import { Context } from '../../types/context';

export const breadcrumbResolvers: IResolvers = {
  Query: {
    breadcrumbs: async (_, { pageType, identifier }, { pgPool }: Context) => {
      const breadcrumbService = new BreadcrumbService(pgPool);
      return breadcrumbService.getBreadcrumbs(pageType, identifier);
    }
  }
}; 