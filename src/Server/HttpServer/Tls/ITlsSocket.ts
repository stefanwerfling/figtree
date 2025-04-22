import net from 'net';
import tls from 'tls';

/**
 * Interface TLS Socket
 */
export interface ITlsSocket extends tls.TLSSocket {

    /**
     * Parent Socket (Raw Socket without crypt)
     */
    _parent?: net.Socket;

}