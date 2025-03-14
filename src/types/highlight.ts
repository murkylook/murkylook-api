export interface Highlight {
    id: number;
    destination_id: number;
    name: string;
    slug: string;
    description: string | null;
    seen_count: number;
    created_at: Date;
    updated_at: Date;
    hidden: boolean;
    image_url: string | null;
    latitude: number | null;
    longitude: number | null;
  }