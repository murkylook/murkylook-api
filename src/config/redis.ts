import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client
export const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        connectTimeout: 10000,
        // Retry strategy for reconnection
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis connection failed after 10 retries');
                return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
        },
    }
});

// Handle Redis connection events
redisClient.on('connect', () => console.log('Redis client connected'));
redisClient.on('error', (err) => console.error('Redis client error:', err));

// Connect to Redis
redisClient.connect().catch(console.error);

// We can keep this file for future use, but it's not imported anywhere now 