import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pgPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: { rejectUnauthorized: false },
    allowExitOnIdle: true
});

pgPool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pgPool.on('connect', (_client) => {
    console.log('New client connected to PostgreSQL');
});

pgPool.on('remove', (_client) => {
    console.log('Client removed from pool');
});

pgPool.connect()
    .then(client => {
        console.log('Successfully connected to PostgreSQL');
        client.release();
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL:', err.message);
    }); 