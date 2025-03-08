import { IResolvers } from '@graphql-tools/utils';
import { breadcrumbResolvers } from './breadcrumb';
import { continentResolvers } from './continent';
import { countryResolvers } from './country';
import { destinationResolvers } from './destination';
import { categoryResolvers } from './category';
import { userResolvers } from './user';
import { visitResolvers } from './visit';
import { statisticsResolvers } from './statistics';

// Cast to any first to avoid TypeScript union type complexity
const mergedResolvers = {
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
  Mutation: {
    ...continentResolvers.Mutation,
    ...countryResolvers.Mutation,
    ...destinationResolvers.Mutation,
    ...categoryResolvers.Mutation,
    ...userResolvers.Mutation,
    ...visitResolvers.Mutation
  },
  Continent: continentResolvers.Continent,
  Country: countryResolvers.Country,
  Destination: destinationResolvers.Destination,
  Category: categoryResolvers.Category,
  User: userResolvers.User,
  Visit: visitResolvers.Visit
} as any as IResolvers;

export default mergedResolvers; 