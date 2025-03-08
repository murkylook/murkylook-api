import DataLoader from 'dataloader';
import { Pool } from 'pg';
import { Continent } from '../../types/continent';
import { Country } from '../../types/country';
import { Destination } from '../../types/destination';
import { User } from '../../types/user';

export interface DataLoaders {
  continentLoader: DataLoader<string, Continent>;
  countryLoader: DataLoader<string, Country>;
  destinationLoader: DataLoader<string, Destination>;
  userLoader: DataLoader<string, User>;
}

export const createLoaders = (pgPool: Pool): DataLoaders => {
  const batchLoadContinent = async (ids: readonly string[]): Promise<Continent[]> => {
    const result = await pgPool.query(
      'SELECT * FROM continents WHERE id = ANY($1)',
      [ids]
    );
    const continentsById = result.rows.reduce((acc, continent) => {
      acc[continent.id] = continent;
      return acc;
    }, {} as Record<string, Continent>);
    
    return ids.map(id => continentsById[id]);
  };

  const batchLoadCountry = async (ids: readonly string[]): Promise<Country[]> => {
    const result = await pgPool.query(
      'SELECT * FROM countries WHERE id = ANY($1)',
      [ids]
    );
    const countriesById = result.rows.reduce((acc, country) => {
      acc[country.id] = country;
      return acc;
    }, {} as Record<string, Country>);
    
    return ids.map(id => countriesById[id]);
  };

  const batchLoadDestination = async (ids: readonly string[]): Promise<Destination[]> => {
    const result = await pgPool.query(
      'SELECT * FROM destinations WHERE id = ANY($1) AND hidden = false',
      [ids]
    );
    const destinationsById = result.rows.reduce((acc, destination) => {
      acc[destination.id] = destination;
      return acc;
    }, {} as Record<string, Destination>);
    
    return ids.map(id => destinationsById[id]);
  };

  const batchLoadUser = async (ids: readonly string[]): Promise<User[]> => {
    const result = await pgPool.query(
      'SELECT * FROM users WHERE id = ANY($1)',
      [ids]
    );
    const usersById = result.rows.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {} as Record<string, User>);
    
    return ids.map(id => usersById[id]);
  };

  return {
    continentLoader: new DataLoader(batchLoadContinent),
    countryLoader: new DataLoader(batchLoadCountry),
    destinationLoader: new DataLoader(batchLoadDestination),
    userLoader: new DataLoader(batchLoadUser)
  };
}; 