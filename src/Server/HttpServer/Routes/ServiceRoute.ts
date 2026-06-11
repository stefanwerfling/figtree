import {Router} from 'express';
import {
    DefaultReturn, SchemaDefaultReturn,
    SchemaServiceByNameRequest,
    SchemaServiceInfoEntry,
    SchemaServiceLogResponse,
    SchemaServiceLogStartRequest,
    SchemaServiceStatusResponse,
    ServiceInfoEntry,
    ServiceLogResponse,
    ServiceStatusResponse,
    StatusCodes
} from 'figtree-schemas';
import {ExtractSchemaResultType, Schema, Vts} from 'vts';
import {ACLRight} from '../../../ACL/ACLRight.js';
import {BackendApp} from '../../../Application/BackendApp.js';
import {BackendCluster} from '../../../Application/BackendCluster.js';
import {ClusterRegistry} from '../../../Cluster/ClusterRegistry.js';
import {SERVICE_MANAGER_NAMESPACE} from '../../../Service/ServiceManager.js';
import {DefaultRoute} from './DefaultRoute.js';
import {DefaultRouteCheckUserLogin} from './DefaultRouteCheckUser.js';

/**
 * Response schema for the cluster status endpoint.
 * `workers` maps `<hostname>:<pid>` to the service info list of that worker.
 */
export const SchemaServiceClusterStatusResponse = Vts.object({
    statusCode: Vts.or<Schema<unknown>>([Vts.string(), Vts.enum(StatusCodes)]),
    msg: Vts.optional(Vts.string()),
    workers: Vts.object2(
        Vts.string(),
        Vts.array(SchemaServiceInfoEntry)
    )
});

export type ServiceClusterStatusResponse = ExtractSchemaResultType<typeof SchemaServiceClusterStatusResponse>;

/**
 * Service ACLRights
 */
export type ServiceRouteACLRights = {
    status: ACLRight;
    start: ACLRight;
    stop: ACLRight;
    invoke: ACLRight;
    /** Defaults to `status` when omitted. */
    clusterStatus?: ACLRight;
    /** Per-service log buffer endpoints. Default to `status` when omitted. */
    logStart?: ACLRight;
    logStop?: ACLRight;
    logFetch?: ACLRight;
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
            async(_request, _response, _data): Promise<ServiceStatusResponse> => {
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
            async(_request, _response, data): Promise<DefaultReturn> => {
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
            async(_request, _response, data): Promise<DefaultReturn> => {
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

        this._get(
            this._getUrl('v1', 'service', 'status/cluster'),
            this._onlyUserAccess,
            async(_request, _response, _data): Promise<ServiceClusterStatusResponse> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (!backend) {
                    return {
                        statusCode: StatusCodes.INTERNAL_ERROR,
                        msg: 'Backend not found, no information for services',
                        workers: {}
                    };
                }

                // Cluster-wide aggregation requires a configured ClusterRegistry.
                // Fall back to local-only view (this worker's id → its services)
                // so the endpoint stays useful in single-process / non-clustered setups.
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
                .queryAll<ServiceInfoEntry[]>(SERVICE_MANAGER_NAMESPACE);

                return {
                    statusCode: StatusCodes.OK,
                    workers: workers
                };
            },
            {
                description: 'Cluster-wide service status — aggregated across all workers and hosts',
                tags: ['service'],
                responseBodySchema: SchemaServiceClusterStatusResponse,
                aclRight: this._accessRights?.clusterStatus ?? this._accessRights?.status
            }
        );

        this._post(
            this._getUrl('v1', 'service', 'log/start'),
            this._onlyUserAccess,
            async(_request, _response, data): Promise<DefaultReturn> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (backend) {
                    try {
                        backend.getServiceManager().enableServiceLog(
                            data.body!.name,
                            data.body!.maxLines
                        );

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
                description: 'Turn on the per-service log ring buffer',
                tags: ['service'],
                bodySchema: SchemaServiceLogStartRequest,
                responseBodySchema: SchemaDefaultReturn,
                aclRight: this._accessRights?.logStart ?? this._accessRights?.status
            }
        );

        this._post(
            this._getUrl('v1', 'service', 'log/stop'),
            this._onlyUserAccess,
            async(_request, _response, data): Promise<DefaultReturn> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (backend) {
                    try {
                        backend.getServiceManager().disableServiceLog(data.body!.name);

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
                description: 'Turn off the per-service log ring buffer and discard captured lines',
                tags: ['service'],
                bodySchema: SchemaServiceByNameRequest,
                responseBodySchema: SchemaDefaultReturn,
                aclRight: this._accessRights?.logStop ?? this._accessRights?.status
            }
        );

        this._get(
            this._getUrl('v1', 'service', 'log/fetch'),
            this._onlyUserAccess,
            async(_request, _response, data): Promise<ServiceLogResponse> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (!backend) {
                    return {
                        statusCode: StatusCodes.INTERNAL_ERROR,
                        msg: 'Backend not found, no information for services',
                    };
                }

                try {
                    const snapshot = backend.getServiceManager().getServiceLog(data.query!.name);

                    return {
                        statusCode: StatusCodes.OK,
                        active: snapshot.active,
                        maxLines: snapshot.maxLines,
                        lines: snapshot.lines,
                    };
                } catch (e) {
                    return {
                        statusCode: StatusCodes.INTERNAL_ERROR,
                        msg: e instanceof Error ? e.message : String(e),
                    };
                }
            },
            {
                description: 'Snapshot of one service\'s log buffer (active flag + captured lines)',
                tags: ['service'],
                querySchema: SchemaServiceByNameRequest,
                responseBodySchema: SchemaServiceLogResponse,
                aclRight: this._accessRights?.logFetch ?? this._accessRights?.status
            }
        );

        this._post(
            this._getUrl('v1', 'service', 'invoke'),
            this._onlyUserAccess,
            async(_request, _response, data): Promise<DefaultReturn> => {
                const backend = BackendApp.getInstance(this._backendInstanceName);

                if (backend) {
                    try {
                        await backend.getServiceManager().invokeService(data.body!.name);

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
                description: 'Service invoke by service name',
                tags: ['service'],
                bodySchema: SchemaServiceByNameRequest,
                responseBodySchema: SchemaDefaultReturn,
                aclRight: this._accessRights?.stop
            }
        );

        return super.getExpressRouter();
    }

}