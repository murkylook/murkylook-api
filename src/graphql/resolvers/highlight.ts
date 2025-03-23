import { IResolvers } from '@graphql-tools/utils';
import { HighlightService } from '../../services/highlight.service';
import { Context } from '../../types/context';
import { Highlight } from '../../types/highlight';

export const highlightResolvers: IResolvers = {
    Query: {
        highlights: async (_, __, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getAll();
        },

        highlight: async (_, { id }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getById(Number(id));
        },

        highlightBySlugAndDestinationSlug: async (_, { slug, destinationSlug }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getBySlugAndDestinationSlug(slug, destinationSlug);
        },

        highlightsByDestination: async (_, { destinationId }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getByDestination(Number(destinationId));
        },

        highlightsByLocation: async (_, { latitude, longitude, radiusKm }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getByCoordinates(latitude, longitude, radiusKm);
        },

        highlightViewsByUser: async (_, { userId }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getViewsByUser(Number(userId));
        },

        highlightViewsByHighlight: async (_, { highlightId }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getViewsByHighlight(Number(highlightId));
        },

        highlightBySlug: async (_, { slug }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getBySlug(slug);
        },
    },

    Highlight: {
        destination: async (highlight: Highlight, _, { loaders }: Context) => {
            return loaders.destinationLoader.load(highlight.destination_id);
        },

        viewStats: async (highlight: Highlight, _, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.getViewStats(highlight.id);
        },

        // seenBy: async (highlight: Highlight, _, { pgPool, loaders }: Context) => {
        //     const query = `
        //         SELECT user_id 
        //         FROM highlights_views 
        //         WHERE highlight_id = $1
        //     `;
        //     const result = await pgPool.query(query, [highlight.id]);
        //     const userIds = result.rows.map(row => row.user_id);
        //     return loaders.userLoader.loadMany(userIds);
        // },
    },

    Mutation: {
        recordHighlightView: async (_, { userId, highlightId }, { pgPool }: Context) => {
            const service = new HighlightService(pgPool);
            return service.recordView(Number(userId), Number(highlightId));
        },
    },
};