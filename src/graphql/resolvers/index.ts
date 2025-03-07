import { IResolvers } from '@graphql-tools/utils';

// Import individual resolver files
import { continentResolvers } from './continent';
import { countryResolvers } from './country';
import { destinationResolvers } from './destination';
import { categoryResolvers } from './category';
import { userResolvers } from './user';
import { visitResolvers } from './visit';
import { statisticsResolvers } from './statistics';
import { breadcrumbResolvers } from './breadcrumb';

export const resolvers: IResolvers = {
  Query: {
    ...breadcrumbResolvers.Query,
    ...continentResolvers.Query,
    ...countryResolvers.Query,
    ...destinationResolvers.Query,
    ...categoryResolvers.Query,
    ...userResolvers.Query,
    ...visitResolvers.Query,
    ...statisticsResolvers.Query
  },
  
  Continent: continentResolvers.Continent || {},
  Country: countryResolvers.Country || {},
  Destination: destinationResolvers.Destination || {},
  DestinationCategory: categoryResolvers.DestinationCategory || {},
  User: userResolvers.User || {},
  Visit: visitResolvers.Visit || {},
  Statistics: statisticsResolvers.Statistics || {},
  VisitStats: visitResolvers.VisitStats || {},
  UserStats: userResolvers.UserStats || {},
  CountryStats: countryResolvers.CountryStats || {},
  ContinentStats: continentResolvers.ContinentStats || {},
  CategoryStats: categoryResolvers.CategoryStats || {},
  DestinationStats: destinationResolvers.DestinationStats || {}
}; 