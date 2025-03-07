/**
 * Database configuration and connection pool setup
 * Uses node-postgres (pg) to manage PostgreSQL connections
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * PostgreSQL connection pool configuration
 * Environment variables:
 * - POSTGRES_USER: Database user
 * - POSTGRES_PASSWORD: Database password
 * - POSTGRES_DB: Database name
 * - POSTGRES_HOST: Database host
 * - POSTGRES_PORT: Database port
 */
export const pgPool = new Pool({
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    // Maximum number of clients in the pool
    max: 20,
    // How long a client can stay idle before being closed
    idleTimeoutMillis: 30000,
    // How long to wait for a connection
    connectionTimeoutMillis: 2000,
});

// Error handling for the pool
pgPool.on('error', (_res) => {
    console.error('Unexpected error on idle client', _res);
    process.exit(-1);
});

// Test the database connection
pgPool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Database connection failed:', err);
    } else {
        console.log('Database connected successfully');
    }
}); 