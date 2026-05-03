export class HttpWebSocketServer {
    constructor(httpServer) {
        const server = httpServer.getServer();
        if (server === null) {
            throw new Error('Http server is not init!');
        }
        server.on('upgrade', (_request, socket, _head) => {
            socket.on('error', (err) => {
                console.error(err);
            });
        });
    }
}
//# sourceMappingURL=HttpWebSocketServer.js.map