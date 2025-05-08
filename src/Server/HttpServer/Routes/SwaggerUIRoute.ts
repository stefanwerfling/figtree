import {Router} from 'express';
import {DefaultRoute} from './DefaultRoute.js';
import swaggerUi from 'swagger-ui-express';

/**
 * Swagger UI Route
 */
export class SwaggerUIRoute extends DefaultRoute {

    /**
     * open api spec
     * @protected
     */
    protected _openApiSpec: any = {
        openapi: '3.0.0',
        info: {
            title: '',
            version: ''
        },
        paths: {}
    };

    /**
     * constructor
     * @param {string} title Title
     * @param {string} version version
     */
    public constructor(title: string = 'Dynamische API', version: string = '1.0.0') {
        super();

        this._openApiSpec.info.title = title;
        this._openApiSpec.info.version = version;
    }

    /**
     * Return the express router
     * @returns {Router}
     */
    public getExpressRouter(): Router {
        this._routes.use('/swagger', swaggerUi.serve);

        this._routes.get('/swagger', (req, res, next) => {
            const handler = swaggerUi.setup(this._openApiSpec);
            handler(req, res, next); // gibt HTML zurück
        });

        return super.getExpressRouter();
    }
}