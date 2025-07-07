export class ServiceError extends Error {
    serviceName;
    constructor(serviceName, message, cause) {
        super(`[${serviceName}] ${message}`);
        this.name = 'ServiceError';
        if (cause instanceof Error && cause.stack) {
            this.stack += '\nCaused by: ' + cause.stack;
        }
        this.serviceName = serviceName;
    }
}
//# sourceMappingURL=ServiceError.js.map