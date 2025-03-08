import { BaseEntity, BaseFilters } from './base';

export interface Destination extends BaseEntity {
  name: string;
  description: string | null;
  country_id: string;
  latitude: number;
  longitude: number;
  image_url: string | null;
  category_id: string | null;
  hidden: boolean;
}

export interface DestinationFilters extends BaseFilters {
  country_id?: string;
  continent_id?: string;
  category_id?: string;
  latitude_min?: number;
  latitude_max?: number;
  longitude_min?: number;
  longitude_max?: number;
}

export interface DestinationInput {
  name: string;
  description?: string | null;
  country_id: string;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  category_ids?: string[];
}

export interface DestinationUpdateInput {
  name?: string;
  description?: string | null;
  country_id?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string | null;
  category_ids?: string[];
} 