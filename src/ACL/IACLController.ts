import {ACLRight} from './ACLRight.js';
import {ACLRole} from './ACLRole.js';

/**
 * Interface ACL Controller
 */
export interface IACLController {

    /**
     * check access
     * @param role
     * @param right
     * @return {boolean}
     */
    checkAccess(role: ACLRole, right: ACLRight): Promise<boolean>;
}