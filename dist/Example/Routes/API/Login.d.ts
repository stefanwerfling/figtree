import { Router } from 'express';
import { DefaultRoute } from '../../../Server/HttpServer/Routes/DefaultRoute.js';
export declare class Login extends DefaultRoute {
    static BASE: string;
    getExpressRouter(): Router;
}
