import { RequestHandler } from 'express';
export type BruteForceProtectionOptions = {
    limit?: number;
    windowMs?: number;
    message?: string;
};
export declare const createBruteForceProtection: (options?: BruteForceProtectionOptions) => RequestHandler;
