import { BaseHttpServerOptions } from './BaseHttpServer.js';
import { HttpServer } from './HttpServer.js';
export type ViteHttpServerOptions = BaseHttpServerOptions & {
    vitePublicDir?: string;
    viteIndexFile?: string;
};
export declare class ViteHttpServer extends HttpServer {
    protected _vitePublicDir: string;
    protected _viteIndexFile: string;
    private _vite?;
    constructor(serverInit: ViteHttpServerOptions);
    protected _initVite(): Promise<void>;
    protected _initExpressUseVite(): void;
    setup(): Promise<void>;
}
