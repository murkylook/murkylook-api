import { Pool } from 'pg';
import { Request } from 'express';
import { User } from './user';

export interface Context {
    pgPool: Pool;
    currentUser?: User;
    req: Request;
} 