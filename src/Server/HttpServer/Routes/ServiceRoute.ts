import {Router} from 'express';
import {BackendApp} from '../../../Application/BackendApp.js';
import {DefaultReturn, SchemaDefaultReturn} from '../../../Schemas/Server/Routes/DefaultReturn.js';
import {
    SchemaServiceByNameRequest,
    SchemaServiceStatusResponse,
    ServiceStatusResponse
} from '../../../Schemas/Server/Routes/Service.js';
import {StatusCodes} from '../../../Schemas/Server/Routes/StatusCodes.js';
import {DefaultRoute} from './DefaultRoute.js';

/**
 * Base Service Route
 */
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

    /**
     * Constructor
     * @param {string} backendInstanceName
     * @param {boolean} onlyUserAccess
     */
    public constructor(backendInstanceName: string, onlyUserAccess: boolean = true) {
        super();
        this._backendInstanceName = backendInstanceName;
        this._onlyUserAccess = onlyUserAccess;
    }

    /**
     * Get Express Router
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
                tags: ['service'],
                responseBodySchema: SchemaServiceStatusResponse
            }
        );

        this._post(
            this._getUrl('v1', 'service', 'start'),
            this._onlyUserAccess,
            async (request, response, data): Promise<DefaultReturn> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (backend) {
                    try {
                        await backend.getServiceManager().start(data.body!.name);

                        return {
                            statusCode: StatusCodes.OK,
                        };
                    } catch (e) {
                        return {
                            statusCode: StatusCodes.INTERNAL_ERROR,
                            msg: e instanceof Error ? e.message : String(e),
                        };
                    }
                }

                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Backend not found, no information for services',
                };
            },
            {
                description: 'Service start by service name',
                tags: ['service'],
                bodySchema: SchemaServiceByNameRequest,
                responseBodySchema: SchemaDefaultReturn
            }
        );

        this._post(
            this._getUrl('v1', 'service', 'stop'),
            this._onlyUserAccess,
            async (request, response, data): Promise<DefaultReturn> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (backend) {
                    try {
                        await backend.getServiceManager().stop(data.body!.name);

                        return {
                            statusCode: StatusCodes.OK,
                        };
                    } catch (e) {
                        return {
                            statusCode: StatusCodes.INTERNAL_ERROR,
                            msg: e instanceof Error ? e.message : String(e),
                        };
                    }
                }

                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Backend not found, no information for services',
                };
            },
            {
                description: 'Service stop by service name',
                tags: ['service'],
                bodySchema: SchemaServiceByNameRequest,
                responseBodySchema: SchemaDefaultReturn
            }
        );

        return super.getExpressRouter();
    }

}