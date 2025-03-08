import { Pool } from 'pg';
import { Request } from 'express';
import DataLoader from 'dataloader';
import { Country } from './country';
import { Category } from './category';
import { Continent } from './continent';
import { Destination } from './destination';
import { User } from './user';
import { Visit } from './visit';
import { BaseFilters, PaginationArgs, OrderByArgs } from './base';

export interface Context {
    pgPool: Pool;
    req: Request;
    loaders: DataLoaders;
}

export interface AuthContext extends Context {
    userId: string;
    roles: string[];
}

export interface DataLoaders {
  countryLoader: DataLoader<string, Country>;
  categoryLoader: DataLoader<string, Category>;
  continentLoader: DataLoader<string, Continent>;
  destinationLoader: DataLoader<string, Destination>;
  userLoader: DataLoader<string, User>;
  visitLoader: DataLoader<string, Visit>;
}

export { BaseFilters, PaginationArgs, OrderByArgs }; 