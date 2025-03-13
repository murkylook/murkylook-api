import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import { json } from 'body-parser';
import { pgPool } from './config/database';
import { typeDefs } from './graphql/schema';
import resolvers from './graphql/resolvers';
import { createLoaders } from './graphql/dataloaders';

dotenv.config();

console.log('=== Resolvers being used ===');
console.log(JSON.stringify(resolvers, null, 2));

// Create the Express app and HTTP server
const app = express();
const httpServer = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.APOLLO_STUDIO_URL || 'https://studio.apollographql.com',
  process.env.ADMIN_URL || 'http://localhost:5173',
  process.env.WEB_URL || 'http://localhost:3001',
  process.env.API_URL || 'http://localhost:4000'
];

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Create the Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  formatError: (error) => {
    // Log the error for debugging
    console.error('GraphQL Error:', error);

    // Return a sanitized error message to the client
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: {
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR'
      }
    };
  }
});

// Start the server
async function startServer() {
  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors<cors.CorsRequest>(corsOptions),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        pgPool,
        req,
        loaders: createLoaders(pgPool)
      })
    })
  );

  // Global error handler
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Start the HTTP server
  await new Promise<void>((resolve) => httpServer.listen({ port: process.env.PORT || 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 4000}/graphql`);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

/**
 * Graceful shutdown handler
 * Ensures all database connections are properly closed
 */
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Performing graceful shutdown...');
    await pgPool.end();
    process.exit(0);
}); 