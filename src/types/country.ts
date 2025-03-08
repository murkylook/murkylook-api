import { BaseEntity, BaseFilters } from './base';

export interface Country extends BaseEntity {
  name: string;
  description: string | null;
  abbreviation: string;
  continent_id: string;
  image_url: string | null;
}

export interface CountryFilters extends BaseFilters {
  abbreviation?: string;
  continent_id?: string;
}

export interface CountryInput {
  name: string;
  description?: string | null;
  abbreviation: string;
  continent_id: string;
  image_url?: string | null;
}

export interface CountryUpdateInput {
  name?: string;
  description?: string | null;
  abbreviation?: string;
  continent_id?: string;
  image_url?: string | null;
} 