export interface Translation {
  id: number;
  table_name: string;
  column_name: string;
  row_id: number;
  language_id: number;
  translated_text: string;
  created_at: Date;
  updated_at: Date;
} 