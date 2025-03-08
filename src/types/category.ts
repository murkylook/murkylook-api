import { BaseFilters } from './base';

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryInput {
  name: string;
  description?: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string;
}

export interface CategoryFilters extends BaseFilters {
  search?: string;
  ids?: string[];
} 