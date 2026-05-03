export var WebSocketCloseCode;
(function (WebSocketCloseCode) {
    WebSocketCloseCode[WebSocketCloseCode["NORMAL"] = 1000] = "NORMAL";
    WebSocketCloseCode[WebSocketCloseCode["GOING_AWAY"] = 1001] = "GOING_AWAY";
    WebSocketCloseCode[WebSocketCloseCode["POLICY_VIOLATION"] = 1008] = "POLICY_VIOLATION";
    WebSocketCloseCode[WebSocketCloseCode["INVALID_PAYLOAD"] = 4400] = "INVALID_PAYLOAD";
    WebSocketCloseCode[WebSocketCloseCode["UNAUTHORIZED"] = 4401] = "UNAUTHORIZED";
    WebSocketCloseCode[WebSocketCloseCode["FORBIDDEN"] = 4403] = "FORBIDDEN";
    WebSocketCloseCode[WebSocketCloseCode["HEARTBEAT_TIMEOUT"] = 4408] = "HEARTBEAT_TIMEOUT";
    WebSocketCloseCode[WebSocketCloseCode["SHUTDOWN"] = 4503] = "SHUTDOWN";
})(WebSocketCloseCode || (WebSocketCloseCode = {}));
//# sourceMappingURL=WebSocketCloseCode.js.map