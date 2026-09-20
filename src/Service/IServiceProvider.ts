import {ProviderEntry} from 'figtree-schemas';
import {IProvider} from '../Provider/IProvider.js';
import {ServiceAbstract} from './ServiceAbstract.js';

/**
 * A single service contributed by a plugin, together with the optional cluster
 * roles it should run on. The `roles` value is passed straight through to
 * `ServiceManager.add()` and follows the same semantics: undefined/empty means
 * "run everywhere", otherwise the service only runs on workers whose
 * `WORKER_ROLE` matches (and always in single-process mode).
 */
export interface ServiceProviderService {

    /**
     * The service instance to register with the `ServiceManager`.
     */
    service: ServiceAbstract;

    /**
     * Optional cluster roles this service should run on. See
     * `ServiceManager.add()` for the exact filter semantics.
     */
    roles?: string[];
}

/**
 * Interface for a service provider — a plugin contributing one or more
 * `ServiceAbstract` instances that are registered with the host's
 * `ServiceManager` before `startAll()` runs.
 *
 * Plugin services are added after the host application's own services (which
 * are registered in `BackendApp._initServices()`), so a plugin service may
 * declare a dependency on a host service by name via
 * `setServiceDependencies()` — `ServiceManager.startAll()` resolves the start
 * order from those dependencies regardless of registration order.
 */
export interface IServiceProvider extends IProvider<ProviderEntry> {

    /**
     * Return one or more services to register. May be sync or async.
     * @return {ServiceProviderService[]}
     */
    getServices(): ServiceProviderService[] | Promise<ServiceProviderService[]>;

}