import { IResolvers } from '@graphql-tools/utils';
import { BreadcrumbService } from '../../services/breadcrumb.service';

export const breadcrumbResolvers: IResolvers = {
  Query: {
    breadcrumbs: async (_, { pageType, identifier }, { _pgPool }) => {
      const breadcrumbService = new BreadcrumbService();
      return breadcrumbService.getBreadcrumbs(pageType, identifier);
    }
  }
}; 