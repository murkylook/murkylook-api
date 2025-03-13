import { Pool } from 'pg';
import { Request } from 'express';
import DataLoader from 'dataloader';
import { Country } from './country';
import { DestinationType } from './destination-type';
import { Continent } from './continent';
import { Destination } from './destination';
import { Highlight } from './highlight';
import { Language } from './language';

export interface Context {
    pgPool: Pool;
    req: Request;
    loaders: DataLoaders;
}

export interface DataLoaders {
  continentLoader: DataLoader<number, Continent, number>;
  countryLoader: DataLoader<number, Country, number>;
  destinationTypeLoader: DataLoader<number, DestinationType, number>;
  destinationLoader: DataLoader<number, Destination, number>;
  highlightLoader: DataLoader<number, Highlight, number>;
  languageLoader: DataLoader<number, Language, number>;
}
