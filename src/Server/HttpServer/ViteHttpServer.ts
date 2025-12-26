import {ViteDevServer} from 'vite';
import {FileHelper} from '../../Utils/FileHelper.js';
import {BaseHttpServerOptions} from './BaseHttpServer.js';
import {HttpServer} from './HttpServer.js';
import { fileURLToPath } from 'url';
import path from 'path';

export type ViteHttpServerOptions = BaseHttpServerOptions & {
    vitePublicDir?: string;
    viteIndexFile?: string;
};

/**
 * Vite http server
 */
export class ViteHttpServer extends HttpServer {

    /**
     * vite public dir
     * @protected
     */
    protected _vitePublicDir: string;

    /**
     * vite index file
     * @protected
     */
    protected _viteIndexFile: string;

    /**
     * vite
     * @private
     */
    private _vite?: ViteDevServer;

    public constructor(serverInit: ViteHttpServerOptions) {
        super(serverInit);

        this._vitePublicDir = serverInit.vitePublicDir ?? path.dirname(fileURLToPath(import.meta.url));
        this._viteIndexFile = serverInit.viteIndexFile ?? 'index.html';
    }

    /**
     * init vite
     * @protected
     */
    protected async _initVite(): Promise<void> {
        if (this._server === null) {
            throw new Error('Server isnt init!');
        }

        if (this._express === undefined) {
            throw new Error('Express isnt init!');
        }

        const { createServer } = await import('vite');

        this._vite = await createServer({
            server: {
                middlewareMode: true,
                hmr: {
                    server: this._server
                }
            },
            appType: 'spa'
        });

        this._express.use(this._vite.middlewares);
    }

    /**
     * init express use vite
     * @protected
     */
    protected _initExpressUseVite(): void {
        if (this._express === undefined) {
            throw new Error('Express isnt init!');
        }

        if (this._vite === undefined) {
            throw new Error('Vite isnt init!');
        }

        if (this._vite) {
            this._express.use(async(
                req,
                res,
                next
            ) => {
                if (this._vite) {
                    try {
                        const html = await this._vite.transformIndexHtml(
                            req.originalUrl,
                            await FileHelper.fileRead(path.join(this._vitePublicDir, this._viteIndexFile))
                        );

                        res.status(200).set('Content-Type', 'text/html').end(html);
                    } catch (e) {
                        this._vite.ssrFixStacktrace(e as Error);
                        next(e);
                    }
                } else {
                    next();
                }
            });
        }
    }

    /**
     * setup
     * @protected
     */
    public override async setup(): Promise<void> {
        this._initExpress();

        // -------------------------------------------------------------------------------------------------------------

        await this._initServer();

        // -------------------------------------------------------------------------------------------------------------
        await this._initVite();

        this._initSession();
        this._initExpressUsePre();
        this._initExpressUseVite();
        this._initExpressUseMain();
        this._initExpressUseAfter();
    }

}