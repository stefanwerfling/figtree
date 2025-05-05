import { DefaultRoute } from './Routes/DefaultRoute.js';
export declare class HttpRouteLoader {
    static loadRoutes(): Promise<DefaultRoute[]>;
}
export type HttpRouteLoaderType = {
    new (): HttpRouteLoader;
    loadRoutes(): Promise<DefaultRoute[]>;
};
