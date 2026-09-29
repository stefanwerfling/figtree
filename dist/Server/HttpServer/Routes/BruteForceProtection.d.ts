import { RequestHandler } from 'express';
export type BruteForceProtectionOptions = {
    limit?: number;
    windowMs?: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
};
export declare const createBruteForceProtection: (options?: BruteForceProtectionOptions) => RequestHandler;
