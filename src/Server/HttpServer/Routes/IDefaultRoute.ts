import {Router} from 'express';

/**
 * Default interface für Route
 */
export interface IDefaultRoute {

    /**
     * Return express Router
     * @return {Router}
     */
    getExpressRouter(): Router;

}