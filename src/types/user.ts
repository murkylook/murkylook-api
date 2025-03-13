export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  last_login_at: Date | null;
  role: string;
  avatar_url: string | null;
  bio: string | null;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
} 