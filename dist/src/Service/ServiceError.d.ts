export declare class ServiceError extends Error {
    readonly serviceName: string;
    constructor(serviceName: string, message: string, cause?: unknown);
}
