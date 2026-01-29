import {ACLRight} from './ACLRight.js';
import {ACLRole} from './ACLRole.js';

/**
 * Interface ACL Controller
 */
export interface IACLController {

    /**
     * check access
     * @param {ACLRole} role current role by group/user
     * @param {ACLRight} right checked Right for access
     * @param {ACLRight[]} userRightList More rights from user (by session, cache ...)
     * @return {boolean}
     */
    checkAccess(role: ACLRole, right: ACLRight, userRightList?: ACLRight[]): Promise<boolean>;
}