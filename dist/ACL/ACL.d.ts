import { ACLRight } from './ACLRight.js';
import { ACLRole } from './ACLRole.js';
import { IACLController } from './IACLController.js';
export declare class ACL {
    protected static _instance: ACL | null;
    static getInstance(): ACL;
    protected _controllers: IACLController[];
    addController(controller: IACLController): void;
    checkAccess(role: ACLRole, right: ACLRight): Promise<boolean>;
}
