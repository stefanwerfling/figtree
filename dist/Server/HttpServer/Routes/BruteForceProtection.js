import rateLimit from 'express-rate-limit';
export const createBruteForceProtection = (options) => rateLimit({
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
//# sourceMappingURL=BruteForceProtection.js.map