/**
 * Main application entry point for the Murkylook API
 * This file sets up the Apollo GraphQL server with Express
 * 
 * Key components:
 * - Express server setup
 * - Apollo Server configuration
 * - Database connection
 * - Error handling
 * - Graceful shutdown
 */

import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import http from 'http';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

// Load environment variables from .env file
dotenv.config();

// Import our GraphQL schema (we'll create this next)
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';

// Import our database configurations
import { pgPool } from './config/database';

// Add this before creating ApolloServer
console.log('=== Resolvers being used ===');
console.log(JSON.stringify(resolvers, null, 2));

async function startApolloServer() {
    // Initialize Express application
    const app = express();
    
    // Create HTTP server instance
    const httpServer = http.createServer(app);

    /**
     * Create Apollo Server instance with:
     * - GraphQL schema (typeDefs)
     * - Resolvers for handling queries/mutations
     * - Plugin for graceful shutdown
     * - Context function to inject dependencies
     * - Debugging options
     */
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        context: async ({ req }) => ({
            pgPool,  // Database connection pool
            req,     // HTTP request object
        }),
        // Add these options for debugging
        debug: true,
        formatError: (error) => {
            console.log('GraphQL Error:', error);
            return error;
        },
        formatResponse: (response) => {
            console.log('GraphQL Response:', response);
            return response;
        }
    });

    // Start the Apollo Server
    await server.start();

    // Apply middleware to Express
    server.applyMiddleware({ 
        app: app as any,
        path: process.env.GRAPHQL_PATH || '/graphql'
    });

    // Start the server
    const PORT = process.env.PORT || 4000;
    await new Promise<void>(resolve => 
        httpServer.listen({ port: PORT }, resolve)
    );

    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);

    // Add error handling middleware
    app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
        console.error(err.stack);
        res.status(500).send('Something broke!');
    });
}

// Handle startup errors
startApolloServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});

/**
 * Graceful shutdown handler
 * Ensures all database connections are properly closed
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    pgPool.end();
    process.exit(0);
}); 