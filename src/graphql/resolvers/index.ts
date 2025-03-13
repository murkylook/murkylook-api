import { IResolvers } from '@graphql-tools/utils';
import { continentResolvers } from './continent';
import { countryResolvers } from './country';
import { destinationResolvers } from './destination';
import { destinationTypeResolvers } from './destination-type';
import { highlightResolvers } from './highlight';

// @ts-expect-error - This is a workaround to avoid TypeScript union type complexity
const mergedResolvers = {
  Query: {
    ...continentResolvers.Query,
    ...countryResolvers.Query,
    ...destinationResolvers.Query,
    ...destinationTypeResolvers.Query,
    ...highlightResolvers.Query
  },
  Continent: continentResolvers.Continent,
  Country: countryResolvers.Country,
  Destination: destinationResolvers.Destination,
  DestinationType: destinationTypeResolvers.DestinationType,
  Highlight: highlightResolvers.Highlight,
} as any as IResolvers;

export default mergedResolvers; 