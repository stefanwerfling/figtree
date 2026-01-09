import { HttpRouteLoaderType } from '../../Server/HttpServer/HttpRouteLoader.js';
import { HttpServer } from '../../Server/HttpServer/HttpServer.js';
import { ServiceAbstract, ServiceImportance } from '../../Service/ServiceAbstract.js';
export declare class HttpService extends ServiceAbstract {
    static NAME: string;
    protected readonly _importance: ServiceImportance;
    protected _loader: HttpRouteLoaderType;
    protected _server: HttpServer | null;
    constructor(loader: HttpRouteLoaderType, serviceName?: string, serviceDependencies?: string[]);
    start(): Promise<void>;
    stop(): Promise<void>;
}
