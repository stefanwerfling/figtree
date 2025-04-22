export interface ITlsClientError extends Error {
    library: string;
    reason: string;
    code: string;
    stack: string;
}
