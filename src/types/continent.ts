export interface Continent {
  id: number;
  name: string;
  slug: string;
  code: string;
  visit_count: number;
  country_count: number;
  created_at: Date;
  updated_at: Date;
  hidden: boolean;
  image_url?: string;
  description?: string;
}
