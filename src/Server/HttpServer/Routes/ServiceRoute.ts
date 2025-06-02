import {Router} from 'express';
import {BackendApp} from '../../../Application/BackendApp.js';
import {SchemaServiceStatusResponse, ServiceStatusResponse} from '../../../Schemas/Server/Routes/Service.js';
import {StatusCodes} from '../../../Schemas/Server/Routes/StatusCodes.js';
import {DefaultRoute} from './DefaultRoute.js';

export class ServiceRoute extends DefaultRoute {

    /**
     * Backend instance name
     * @protected
     */
    protected _backendInstanceName: string;

    /**
     * Default true
     * @protected
     */
    protected _onlyUserAccess: boolean;

    public constructor(backendInstanceName: string, onlyUserAccess: boolean = true) {
        super();
        this._backendInstanceName = backendInstanceName;
        this._onlyUserAccess = onlyUserAccess;
    }

    /**
     * Het Express Router
     * @return {Router}
     */
    public getExpressRouter(): Router {
        this._get(
            this._getUrl('v1', 'service', 'status'),
            this._onlyUserAccess,
            async (request, response, data): Promise<ServiceStatusResponse> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (backend) {
                    const sm = backend.getServiceManager();

                    return {
                        statusCode: StatusCodes.OK,
                        services: sm.getInfoList()
                    };
                }

                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Backend not found, no information for services',
                    services: []
                };
            },
            {
                description: 'Service status list',
                responseBodySchema: SchemaServiceStatusResponse
            }
        )

        return super.getExpressRouter();
    }

}