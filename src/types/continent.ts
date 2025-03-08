import { BaseEntity, BaseFilters } from './base';

export interface Continent extends BaseEntity {
  name: string;
  description: string | null;
  abbreviation: string;
  image_url: string | null;
}

export interface ContinentFilters extends BaseFilters {
  abbreviation?: string;
}

export interface ContinentInput {
  name: string;
  description?: string | null;
  abbreviation: string;
  image_url?: string | null;
}

export interface ContinentUpdateInput {
  name?: string;
  description?: string | null;
  abbreviation?: string;
  image_url?: string | null;
} 