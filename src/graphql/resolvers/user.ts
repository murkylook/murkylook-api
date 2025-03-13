import { IResolvers } from '@graphql-tools/utils';
import { UserService } from '../../services/user.service';
import { DestinationService } from '../../services/destination.service';
import { HighlightService } from '../../services/highlight.service';
import { Context } from '../../types/context';
import { User } from '../../types/user';

export const userResolvers: IResolvers = {
    Query: {
        users: async (_, __, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.getAll();
        },

        user: async (_, { id }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.getById(Number(id));
        },

        userByUsername: async (_, { username }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.getByUsername(username);
        },

        userByEmail: async (_, { email }, { pgPool }: Context) => {
            const service = new UserService(pgPool);
            return service.getByEmail(email);
        },
    },

    User: {
        destinationVisits: async (user: User, _, { pgPool }: Context) => {
            const service = new DestinationService(pgPool);
            return service.getVisitsByUser(user.id);
        },

        highlightViews: async (user: User, _, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getViewsByUser(user.id);
        },
    },
}; 