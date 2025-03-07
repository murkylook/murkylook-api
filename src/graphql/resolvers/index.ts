import { IResolvers } from '@graphql-tools/utils';
import { GraphQLDateTime } from 'graphql-iso-date';

// Import individual resolver files (we'll create these next)
import { continentResolvers } from './continent';
import { countryResolvers } from './country';
import { destinationResolvers } from './destination';
import { categoryResolvers } from './category';
import { userResolvers } from './user';
import { visitResolvers } from './visit';
import { statisticsResolvers } from './statistics';

export const resolvers: IResolvers = {
    // Custom scalar for DateTime
    DateTime: GraphQLDateTime,
    // Combine all resolvers
    Query: {
        ...continentResolvers.Query,
        ...countryResolvers.Query,
        ...destinationResolvers.Query,
        ...categoryResolvers.Query,
        ...userResolvers.Query,
        ...visitResolvers.Query,
        ...statisticsResolvers.Query,
    },

    // Type resolvers
    Continent: continentResolvers.Continent,
    Country: countryResolvers.Country,
    Destination: destinationResolvers.Destination,
    DestinationCategory: categoryResolvers.DestinationCategory,
    User: userResolvers.User,
    Visit: visitResolvers.Visit,
    Statistics: statisticsResolvers.Statistics,
}; 