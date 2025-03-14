export interface Destination {
  id: number;
  country_id: number;
  type_id: number;
  name: string;
  slug: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  founded_year: number | null;
  best_season_start: Date | null;
  best_season_end: Date | null;
  visit_count: number;
  highlight_count: number;
  created_at: Date;
  updated_at: Date;
  image_url: string | null;
  hidden: boolean;
}