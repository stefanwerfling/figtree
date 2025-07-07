import { Rbac } from 'rbac-simple';
import { ACLRight } from './ACLRight.js';
import { ACLRole } from './ACLRole.js';
import { IACLController } from './IACLController.js';
export declare abstract class ACLRbac<Role extends string, Right extends string> implements IACLController {
    protected _rbac: Rbac<Role, Right> | undefined;
    checkAccess(role: ACLRole, right: ACLRight): Promise<boolean>;
}
