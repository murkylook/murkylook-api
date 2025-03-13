export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    avatar_url: string | null;
  };
  token: string;
}

export interface AuthContext {
  user: {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    avatar_url: string | null;
  } | null;
  isAuthenticated: boolean;
} 