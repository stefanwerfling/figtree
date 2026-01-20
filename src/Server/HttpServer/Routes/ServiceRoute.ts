import {Router} from 'express';
import {
    DefaultReturn, SchemaDefaultReturn,
    SchemaServiceByNameRequest,
    SchemaServiceStatusResponse,
    ServiceStatusResponse,
    StatusCodes
} from 'figtree-schemas';
import {ACLRight} from '../../../ACL/ACLRight.js';
import {BackendApp} from '../../../Application/BackendApp.js';
import {DefaultRoute} from './DefaultRoute.js';
import {DefaultRouteCheckUserLogin} from './DefaultRouteCheckUser.js';

export type ServiceRouteACLRights = {
    status: ACLRight
    start: ACLRight,
    stop: ACLRight
};

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
    protected _onlyUserAccess: boolean|DefaultRouteCheckUserLogin;

    /**
     * access rights for default routes service
     * @protected
     */
    protected _accessRights?: ServiceRouteACLRights;

    /**
     * Constructor
     * @param {string} backendInstanceName
     * @param {boolean|DefaultRouteCheckUserLogin} onlyUserAccess
     * @param accessRights
     */
    public constructor(
        backendInstanceName: string,
        onlyUserAccess: boolean|DefaultRouteCheckUserLogin = true,
        accessRights?: ServiceRouteACLRights
    ) {
        super();
        this._backendInstanceName = backendInstanceName;
        this._onlyUserAccess = onlyUserAccess;
        this._accessRights = accessRights;
    }

    /**
     * Get Express Router
     * @return {Router}
     */
    public getExpressRouter(): Router {
        this._get(
            this._getUrl('v1', 'service', 'status'),
            this._onlyUserAccess,
            async (_request, _response, _data): Promise<ServiceStatusResponse> => {
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
                responseBodySchema: SchemaServiceStatusResponse,
                aclRight: this._accessRights?.status
            }
        );

        this._post(
            this._getUrl('v1', 'service', 'start'),
            this._onlyUserAccess,
            async (_request, _response, data): Promise<DefaultReturn> => {
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
                responseBodySchema: SchemaDefaultReturn,
                aclRight: this._accessRights?.start
            }
        );

        this._post(
            this._getUrl('v1', 'service', 'stop'),
            this._onlyUserAccess,
            async (_request, _response, data): Promise<DefaultReturn> => {
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
                responseBodySchema: SchemaDefaultReturn,
                aclRight: this._accessRights?.stop
            }
        );

        return super.getExpressRouter();
    }

}