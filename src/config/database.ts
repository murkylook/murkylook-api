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
 * - DB_USER: Database user
 * - DB_PASSWORD: Database password
 * - DB_NAME: Database name
 * - DB_HOST: Database host
 * - DB_PORT: Database port
 */
export const pgPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    // Maximum number of clients in the pool
    max: 20,
    // How long a client can stay idle before being closed
    idleTimeoutMillis: 30000,
    // How long to wait for a connection
    connectionTimeoutMillis: 2000,
    ssl: {
        rejectUnauthorized: false // Required for DigitalOcean managed databases
      }
});

// Error handling for the pool
pgPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection on startup
pgPool.connect()
    .then(client => {
        console.log('Successfully connected to PostgreSQL');
        client.release();
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL:', err.message);
    }); 