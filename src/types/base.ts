export interface BaseFilters {
  search?: string;
  ids?: string[];
}

export interface PaginationArgs {
  offset?: number;
  limit?: number;
}

export type OrderByArgs = 
  | 'NAME_ASC'
  | 'NAME_DESC'
  | 'CREATED_AT_ASC'
  | 'CREATED_AT_DESC'
  | 'VISITS_DESC'
  | 'RATING_DESC'
  | 'POPULARITY';

export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
} 