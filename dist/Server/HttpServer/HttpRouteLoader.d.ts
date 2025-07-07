import { IDefaultRoute } from './Routes/IDefaultRoute.js';
export declare class HttpRouteLoader {
    static loadRoutes(): Promise<IDefaultRoute[]>;
}
export type HttpRouteLoaderType = {
    new (): HttpRouteLoader;
    loadRoutes(): Promise<IDefaultRoute[]>;
};
