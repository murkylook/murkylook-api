import DataLoader from 'dataloader';
import { Pool } from 'pg';
import { Continent } from '../../types/continent';
import { Country } from '../../types/country';
import { Destination } from '../../types/destination';
import { DestinationType } from '../../types/destination-type';
import { Highlight } from '../../types/highlight';
import { Language } from '../../types/language';
import { User } from '../../types/user';
import { DataLoaders } from '../../types/context';

export const createLoaders = (pgPool: Pool): DataLoaders => {
  const batchLoadContinent = async (ids: readonly number[]): Promise<Continent[]> => {
    const result = await pgPool.query(
      'SELECT * FROM continents WHERE id = ANY($1)',
      [ids]
    );
    const continentsById = result.rows.reduce((acc, continent) => {
      acc[continent.id] = continent;
      return acc;
    }, {} as Record<number, Continent>);
    
    return ids.map(id => continentsById[id]);
  };

  const batchLoadCountry = async (ids: readonly number[]): Promise<Country[]> => {
    const result = await pgPool.query(
      'SELECT * FROM countries WHERE id = ANY($1)',
      [ids]
    );
    const countriesById = result.rows.reduce((acc, country) => {
      acc[country.id] = country;
      return acc;
    }, {} as Record<number, Country>);
    
    return ids.map(id => countriesById[id]);
  };

  const batchLoadDestination = async (ids: readonly number[]): Promise<Destination[]> => {
    const result = await pgPool.query(
      'SELECT * FROM destinations WHERE id = ANY($1) AND hidden = false',
      [ids]
    );
    const destinationsById = result.rows.reduce((acc, destination) => {
      acc[destination.id] = destination;
      return acc;
    }, {} as Record<number, Destination>);
    
    return ids.map(id => destinationsById[id]);
  };

  const batchLoadDestinationType = async (ids: readonly number[]): Promise<DestinationType[]> => {
    const result = await pgPool.query(
      'SELECT * FROM destination_types WHERE id = ANY($1)',
      [ids]
    );
    const typesById = result.rows.reduce((acc, type) => {
      acc[type.id] = type;
      return acc;
    }, {} as Record<number, DestinationType>);
    
    return ids.map(id => typesById[id]);
  };

  const batchLoadHighlight = async (ids: readonly number[]): Promise<Highlight[]> => {
    const result = await pgPool.query(
      'SELECT * FROM highlights WHERE id = ANY($1) AND hidden = false',
      [ids]
    );
    const highlightsById = result.rows.reduce((acc, highlight) => {
      acc[highlight.id] = highlight;
      return acc;
    }, {} as Record<number, Highlight>);
    
    return ids.map(id => highlightsById[id]);
  };

  const batchLoadLanguage = async (ids: readonly number[]): Promise<Language[]> => {
    const result = await pgPool.query(
      'SELECT * FROM languages WHERE id = ANY($1)',
      [ids]
    );
    const languagesById = result.rows.reduce((acc, language) => {
      acc[language.id] = language;
      return acc;
    }, {} as Record<number, Language>);
    
    return ids.map(id => languagesById[id]);
  };

  const batchLoadUser = async (ids: readonly number[]): Promise<User[]> => {
    const result = await pgPool.query(
      'SELECT * FROM users WHERE id = ANY($1) AND hidden = false',
      [ids]
    );
    const usersById = result.rows.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<number, User>);
    
    return ids.map(id => usersById[id]);
  };

  return {
    continentLoader: new DataLoader(batchLoadContinent),
    countryLoader: new DataLoader(batchLoadCountry),
    destinationLoader: new DataLoader(batchLoadDestination),
    destinationTypeLoader: new DataLoader(batchLoadDestinationType),
    highlightLoader: new DataLoader(batchLoadHighlight),
    languageLoader: new DataLoader(batchLoadLanguage),
    userLoader: new DataLoader(batchLoadUser),
  };
}; 