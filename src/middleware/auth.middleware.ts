import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { Pool } from 'pg';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export const authMiddleware = (pool: Pool) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Get token from cookie
      const token = req.cookies.token;

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Verify token
      const authService = new AuthService(pool);
      const decoded = await authService.verifyToken(token);
      req.user = {
        id: decoded.userId,
        role: decoded.role
      };

      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}; 