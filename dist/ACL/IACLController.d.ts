import { ACLRight } from './ACLRight.js';
import { ACLRole } from './ACLRole.js';
export interface IACLController {
    checkAccess(role: ACLRole, right: ACLRight, userRightList?: ACLRight[]): Promise<boolean>;
}
