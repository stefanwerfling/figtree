import {Rbac} from 'rbac-simple';
import {ACLRight} from './ACLRight.js';
import {ACLRole} from './ACLRole.js';
import {IACLController} from './IACLController.js';

/**
 * Abstract ACL Rbac object
 */
export abstract class ACLRbac<Role extends string, Right extends string> implements IACLController {

    /**
     * Rbac object
     * @protected
     */
    protected _rbac: Rbac<Role, Right> | undefined;

    /**
     * Check access
     * @param {ACLRole} role
     * @param {ACLRight} right
     */
    public async checkAccess(role: ACLRole, right: ACLRight): Promise<boolean> {
        if (this._rbac) {
            return this._rbac.checkAccess(role as Role, right as Right);
        }

        return false;
    }
}