import { Request, Response } from 'express';
import { BaseHttpCertKey, BaseHttpServer, BaseHttpServerOptionCrypt } from './BaseHttpServer.js';
export declare class HttpServer extends BaseHttpServer {
    protected _initServer(): void;
    protected _limiterSkip(request: Request): Promise<boolean>;
    protected _limiterLimit(request: Request): Promise<number>;
    protected _limiterHandler(req: Request, res: Response): Promise<void>;
    protected _generateCertAndKey(): Promise<BaseHttpCertKey>;
    protected _getCertAndKey(options: BaseHttpServerOptionCrypt): Promise<BaseHttpCertKey | null>;
}
