import { SchemaDefaultReturn, SchemaServiceByNameRequest, SchemaServiceStatusResponse, StatusCodes } from 'figtree-schemas';
import { BackendApp } from '../../../Application/BackendApp.js';
import { DefaultRoute } from './DefaultRoute.js';
export class ServiceRoute extends DefaultRoute {
    _backendInstanceName;
    _onlyUserAccess;
    _accessRights;
    constructor(backendInstanceName, onlyUserAccess = true, accessRights) {
        super();
        this._backendInstanceName = backendInstanceName;
        this._onlyUserAccess = onlyUserAccess;
        this._accessRights = accessRights;
    }
    getExpressRouter() {
        this._get(this._getUrl('v1', 'service', 'status'), this._onlyUserAccess, async (_request, _response, _data) => {
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
        }, {
            description: 'Service status list',
            tags: ['service'],
            responseBodySchema: SchemaServiceStatusResponse,
            aclRight: this._accessRights?.status
        });
        this._post(this._getUrl('v1', 'service', 'start'), this._onlyUserAccess, async (_request, _response, data) => {
            const backend = BackendApp.getInstance(this._backendInstanceName);
            if (backend) {
                try {
                    await backend.getServiceManager().start(data.body.name);
                    return {
                        statusCode: StatusCodes.OK,
                    };
                }
                catch (e) {
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
        }, {
            description: 'Service start by service name',
            tags: ['service'],
            bodySchema: SchemaServiceByNameRequest,
            responseBodySchema: SchemaDefaultReturn,
            aclRight: this._accessRights?.start
        });
        this._post(this._getUrl('v1', 'service', 'stop'), this._onlyUserAccess, async (_request, _response, data) => {
            const backend = BackendApp.getInstance(this._backendInstanceName);
            if (backend) {
                try {
                    await backend.getServiceManager().stop(data.body.name);
                    return {
                        statusCode: StatusCodes.OK,
                    };
                }
                catch (e) {
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
        }, {
            description: 'Service stop by service name',
            tags: ['service'],
            bodySchema: SchemaServiceByNameRequest,
            responseBodySchema: SchemaDefaultReturn,
            aclRight: this._accessRights?.stop
        });
        return super.getExpressRouter();
    }
}
//# sourceMappingURL=ServiceRoute.js.map