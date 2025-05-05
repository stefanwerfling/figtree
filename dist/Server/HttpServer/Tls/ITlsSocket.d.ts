import net from 'net';
import tls from 'tls';
export interface ITlsSocket extends tls.TLSSocket {
    _parent?: net.Socket;
}
