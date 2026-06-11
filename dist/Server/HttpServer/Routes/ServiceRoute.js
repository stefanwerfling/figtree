import { SchemaDefaultReturn, SchemaServiceByNameRequest, SchemaServiceInfoEntry, SchemaServiceLogResponse, SchemaServiceLogStartRequest, SchemaServiceStatusResponse, StatusCodes } from 'figtree-schemas';
import { Vts } from 'vts';
import { BackendApp } from '../../../Application/BackendApp.js';
import { BackendCluster } from '../../../Application/BackendCluster.js';
import { ClusterRegistry } from '../../../Cluster/ClusterRegistry.js';
import { SERVICE_MANAGER_NAMESPACE } from '../../../Service/ServiceManager.js';
import { DefaultRoute } from './DefaultRoute.js';
export const SchemaServiceClusterStatusResponse = Vts.object({
    statusCode: Vts.or([Vts.string(), Vts.enum(StatusCodes)]),
    msg: Vts.optional(Vts.string()),
    workers: Vts.object2(Vts.string(), Vts.array(SchemaServiceInfoEntry))
});
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
        this._get(this._getUrl('v1', 'service', 'status/cluster'), this._onlyUserAccess, async (_request, _response, _data) => {
            const backend = BackendApp.getInstance(this._backendInstanceName);
            if (!backend) {
                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Backend not found, no information for services',
                    workers: {}
                };
            }
            if (!ClusterRegistry.hasInstance()) {
                return {
                    statusCode: StatusCodes.OK,
                    msg: 'ClusterRegistry not initialized — returning local view only',
                    workers: {
                        [BackendCluster.getWorkerId()]: backend.getServiceManager().getInfoList()
                    }
                };
            }
            const workers = await ClusterRegistry.getInstance()
                .queryAll(SERVICE_MANAGER_NAMESPACE);
            return {
                statusCode: StatusCodes.OK,
                workers: workers
            };
        }, {
            description: 'Cluster-wide service status — aggregated across all workers and hosts',
            tags: ['service'],
            responseBodySchema: SchemaServiceClusterStatusResponse,
            aclRight: this._accessRights?.clusterStatus ?? this._accessRights?.status
        });
        this._post(this._getUrl('v1', 'service', 'log/start'), this._onlyUserAccess, async (_request, _response, data) => {
            const backend = BackendApp.getInstance(this._backendInstanceName);
            if (backend) {
                try {
                    backend.getServiceManager().enableServiceLog(data.body.name, data.body.maxLines);
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
            description: 'Turn on the per-service log ring buffer',
            tags: ['service'],
            bodySchema: SchemaServiceLogStartRequest,
            responseBodySchema: SchemaDefaultReturn,
            aclRight: this._accessRights?.logStart ?? this._accessRights?.status
        });
        this._post(this._getUrl('v1', 'service', 'log/stop'), this._onlyUserAccess, async (_request, _response, data) => {
            const backend = BackendApp.getInstance(this._backendInstanceName);
            if (backend) {
                try {
                    backend.getServiceManager().disableServiceLog(data.body.name);
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
            description: 'Turn off the per-service log ring buffer and discard captured lines',
            tags: ['service'],
            bodySchema: SchemaServiceByNameRequest,
            responseBodySchema: SchemaDefaultReturn,
            aclRight: this._accessRights?.logStop ?? this._accessRights?.status
        });
        this._get(this._getUrl('v1', 'service', 'log/fetch'), this._onlyUserAccess, async (_request, _response, data) => {
            const backend = BackendApp.getInstance(this._backendInstanceName);
            if (!backend) {
                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Backend not found, no information for services',
                };
            }
            try {
                const snapshot = backend.getServiceManager().getServiceLog(data.query.name);
                return {
                    statusCode: StatusCodes.OK,
                    active: snapshot.active,
                    maxLines: snapshot.maxLines,
                    lines: snapshot.lines,
                };
            }
            catch (e) {
                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: e instanceof Error ? e.message : String(e),
                };
            }
        }, {
            description: 'Snapshot of one service\'s log buffer (active flag + captured lines)',
            tags: ['service'],
            querySchema: SchemaServiceByNameRequest,
            responseBodySchema: SchemaServiceLogResponse,
            aclRight: this._accessRights?.logFetch ?? this._accessRights?.status
        });
        this._post(this._getUrl('v1', 'service', 'invoke'), this._onlyUserAccess, async (_request, _response, data) => {
            const backend = BackendApp.getInstance(this._backendInstanceName);
            if (backend) {
                try {
                    await backend.getServiceManager().invokeService(data.body.name);
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
            description: 'Service invoke by service name',
            tags: ['service'],
            bodySchema: SchemaServiceByNameRequest,
            responseBodySchema: SchemaDefaultReturn,
            aclRight: this._accessRights?.stop
        });
        return super.getExpressRouter();
    }
}
//# sourceMappingURL=ServiceRoute.js.map