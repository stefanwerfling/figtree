import { Router } from 'express';
export interface IDefaultRoute {
    getExpressRouter(): Router;
}
