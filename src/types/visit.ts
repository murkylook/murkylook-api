import { BaseFilters } from './base';

export interface Visit {
  id: string;
  user_id: string;
  destination_id: string;
  visited_at: Date;
  rating?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface VisitInput {
  user_id: string;
  destination_id: string;
  visited_at: Date;
  rating?: number;
  notes?: string;
}

export interface VisitUpdateInput extends Partial<VisitInput> {}

export interface VisitFilters extends BaseFilters {
  user_id?: string;
  destination_id?: string;
  from_date?: Date;
  to_date?: Date;
} 