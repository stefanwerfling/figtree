import { FileHelper } from '../../Utils/FileHelper.js';
import { HttpServer } from './HttpServer.js';
import { fileURLToPath } from 'url';
import path from 'path';
export class ViteHttpServer extends HttpServer {
    _vitePublicDir;
    _viteIndexFile;
    _vite;
    constructor(serverInit) {
        super(serverInit);
        this._vitePublicDir = serverInit.vitePublicDir ?? path.dirname(fileURLToPath(import.meta.url));
        this._viteIndexFile = serverInit.viteIndexFile ?? 'index.html';
    }
    async _initVite() {
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
    _initExpressUseVite() {
        if (this._express === undefined) {
            throw new Error('Express isnt init!');
        }
        if (this._vite === undefined) {
            throw new Error('Vite isnt init!');
        }
        if (this._vite) {
            this._express.use(async (req, res, next) => {
                if (this._vite) {
                    try {
                        const html = await this._vite.transformIndexHtml(req.originalUrl, await FileHelper.fileRead(path.join(this._vitePublicDir, this._viteIndexFile)));
                        res.status(200).set('Content-Type', 'text/html').end(html);
                    }
                    catch (e) {
                        this._vite.ssrFixStacktrace(e);
                        next(e);
                    }
                }
                else {
                    next();
                }
            });
        }
    }
    async setup() {
        this._initExpress();
        await this._initServer();
        await this._initVite();
        this._initSession();
        this._initExpressUsePre();
        this._initExpressUseVite();
        this._initExpressUseMain();
        this._initExpressUseAfter();
    }
}
//# sourceMappingURL=ViteHttpServer.js.map