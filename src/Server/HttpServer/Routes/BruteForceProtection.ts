import rateLimit from 'express-rate-limit';
import {RequestHandler} from 'express';

/**
 * Options for brute force protection
 */
export type BruteForceProtectionOptions = {
    /** Maximum number of requests within the window. Default: 10 */
    limit?: number;
    /** Time window in milliseconds. Default: 15 minutes */
    windowMs?: number;
    /** Message returned when limit is exceeded. Default: 'Too many attempts, please try again later.' */
    message?: string;
};

/**
 * Creates a rate limiter middleware to protect endpoints against brute force attacks.
 * Use via the `parser` field in DefaultRouteMethodeDescription.
 *
 * @example
 * this._post(
 *     this._getUrl('v1', 'login', 'login/'),
 *     false,
 *     handler,
 *     {
 *         parser: createBruteForceProtection({ limit: 10 }),
 *         bodySchema: SchemaLoginRequest,
 *     }
 * );
 *
 * @param {BruteForceProtectionOptions} options
 * @returns {RequestHandler}
 */
export const createBruteForceProtection = (options?: BruteForceProtectionOptions): RequestHandler => rateLimit({
    windowMs: options?.windowMs ?? 15 * 60 * 1000,
    limit: options?.limit ?? 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            statusCode: 429,
            msg: options?.message ?? 'Too many attempts, please try again later.'
        });
    }
});