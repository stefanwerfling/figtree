/**
 * WebSocket close codes used by FigTree's WebSocketServer.
 *
 * The 4000-4999 range is reserved by RFC 6455 for application-defined codes.
 * Standard codes (1000-1015) are passed through unchanged.
 */
export enum WebSocketCloseCode {
    /** Normal close. */
    NORMAL = 1000,

    /** Endpoint going away. */
    GOING_AWAY = 1001,

    /** Server failed to honor the upgrade because the request did not pass session/auth checks. */
    POLICY_VIOLATION = 1008,

    /** Server received a malformed or schema-invalid message. */
    INVALID_PAYLOAD = 4400,

    /** Authentication required but missing or expired. */
    UNAUTHORIZED = 4401,

    /** Authenticated but lacking the required ACL right. */
    FORBIDDEN = 4403,

    /** Connection idle — no pong response within heartbeat window. */
    HEARTBEAT_TIMEOUT = 4408,

    /** Server is shutting down. */
    SHUTDOWN = 4503
}