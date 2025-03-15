import { IResolvers } from '@graphql-tools/utils';
import { continentResolvers } from './continent';
import { countryResolvers } from './country';
import { destinationResolvers } from './destination';
import { destinationTypeResolvers } from './destination-type';
import { highlightResolvers } from './highlight';
import { languageResolvers } from './language';
import { translationResolvers } from './translation';
import { searchResolvers } from './search';
import { userResolvers } from './user';
import { authResolvers } from './auth';
import { homeResolvers } from './home';

const mergedResolvers: IResolvers = {
  //@ts-expect-error -- TypeScript limitation with complex resolver types
  Query: {
    ...continentResolvers.Query,
    ...countryResolvers.Query,
    ...destinationResolvers.Query,
    ...destinationTypeResolvers.Query,
    ...highlightResolvers.Query,
    ...languageResolvers.Query,
    ...translationResolvers.Query,
    ...searchResolvers.Query,
    ...userResolvers.Query,
    ...authResolvers.Query,
    ...homeResolvers.Query
  },
  Continent: continentResolvers.Continent,
  Country: countryResolvers.Country,
  Destination: destinationResolvers.Destination,
  DestinationType: destinationTypeResolvers.DestinationType,
  Highlight: highlightResolvers.Highlight,
  Translation: translationResolvers.Translation,
  User: userResolvers.User,
  //@ts-expect-error -- TypeScript limitation with complex resolver types
  Mutation: {
    ...authResolvers.Mutation
  }
};

export default mergedResolvers; 