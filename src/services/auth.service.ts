import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginInput, RegisterInput, AuthResponse } from '../types/auth';

export class AuthService {
  constructor(private readonly pool: Pool) {}

  async getById(id: number) {
    const query = `
      SELECT id, name, username, email, role, avatar_url
      FROM users
      WHERE id = $1 AND hidden = false
    `;
    
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $2',
      [input.email, input.username]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    // Create user
    const result = await this.pool.query(
      `INSERT INTO users (name, username, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING id, name, username, email, role, avatar_url`,
      [input.name, input.username, input.email, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      },
      token
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email = $1',
      [input.email]
    );

    const user = result.rows[0];

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await this.pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar_url: user.avatar_url
      },
      token
    };
  }

  async verifyToken(token: string): Promise<{ userId: number; role: string }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: number; role: string };
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
} 