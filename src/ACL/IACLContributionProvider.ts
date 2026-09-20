import {ProviderEntry} from 'figtree-schemas';
import {IProvider} from '../Provider/IProvider.js';
import {IACLController} from './IACLController.js';

/**
 * Interface for an ACL contribution provider — a plugin contributing one or
 * more `IACLController` instances (typically `ACLRbac` subclasses) that are
 * registered with the process-wide `ACL` singleton before the backend starts
 * serving traffic.
 *
 * Roles and rights are plain strings evaluated inside a controller's
 * `checkAccess()`, so a plugin contributes access logic by supplying its own
 * controller rather than by registering roles/rights separately. Controllers
 * are consulted in registration order and the first `true` wins
 * (see `ACL.checkAccess`).
 */
export interface IACLContributionProvider extends IProvider<ProviderEntry> {

    /**
     * Return one or more ACL controllers to register. May be sync or async.
     * @return {IACLController[]}
     */
    getControllers(): IACLController[] | Promise<IACLController[]>;

}