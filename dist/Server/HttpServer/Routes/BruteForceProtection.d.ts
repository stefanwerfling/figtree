import { RequestHandler } from 'express';
export type BruteForceProtectionOptions = {
    limit?: number;
    windowMs?: number;
    message?: string;
};
export declare function createBruteForceProtection(options?: BruteForceProtectionOptions): RequestHandler;
