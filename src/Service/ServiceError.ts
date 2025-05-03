/**
 * Service Error
 */
export class ServiceError extends Error {

    /**
     * service name
     * @public
     */
    public readonly serviceName: string;

    /**
     * Constructor
     * @param {string} serviceName
     * @param {string} message
     * @param {[unknown]} cause
     */
    public constructor(serviceName: string, message: string, cause?: unknown) {
        super(`[${serviceName}] ${message}`);
        this.name = 'ServiceError';

        if (cause instanceof Error && cause.stack) {
            this.stack += '\nCaused by: ' + cause.stack;
        }

        this.serviceName = serviceName;
    }
}