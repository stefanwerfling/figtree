/**
 * Interface Tls Client Error
 */
export interface ITlsClientError extends Error {

    /**
     * Libary
     */
    library: string;

    /**
     * Reason
     */
    reason: string;

    /**
     * Code
     */
    code: string;

    /**
     * Stack
     */
    stack: string;

}