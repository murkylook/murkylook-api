import { IResolvers } from '@graphql-tools/utils';
import { AuthService } from '../../services/auth.service';
import { Context } from '../../types/context';
import { Response } from 'express';

export const authResolvers: IResolvers = {
  Query: {
    me: async (_, __, { user, pgPool }: Context) => {
      if (!user) return null;
      
      const service = new AuthService(pgPool);
      return service.getById(user.id);
    },
  },

  Mutation: {
    register: async (_, { input }, { pgPool, res }: Context & { res: Response }) => {
      const service = new AuthService(pgPool);
      const result = await service.register(input);

      // Set token cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return result;
    },

    login: async (_, { input }, { pgPool, res }: Context & { res: Response }) => {
      const service = new AuthService(pgPool);
      const result = await service.login(input);

      // Set token cookie
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      return result;
    },

    logout: async (_, __, { res }: Context & { res: Response }) => {
      // Clear token cookie
      res.clearCookie('token');
      return true;
    },
  },
}; 