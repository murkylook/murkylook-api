export interface DestinationType {
  id: number;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  icon_name: string | null;
  destination_count: number;
}