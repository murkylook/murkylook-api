export interface Country {
  id: number;
  continent_id: number;
  name: string;
  iso_code: string;
  iso_code3: string;
  visit_count: number;
  destination_count: number;
  image_url: string | null;
  hidden: boolean;
  created_at: Date;
  updated_at: Date;
  description: string | null;
}  