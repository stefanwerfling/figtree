import {ACLRight} from './ACLRight.js';
import {ACLRole} from './ACLRole.js';
import {IACLController} from './IACLController.js';

/**
 * ACL class
 */
export class ACL {

    /**
     * Instance of ACL
     * @protected
     */
    protected static _instance: ACL|null = null;

    /**
     * Return the instance
     * @return {ACL}
     */
    public static getInstance(): ACL {
        if (this._instance === null) {
            this._instance = new ACL();
        }

        return this._instance;
    }

    /**
     * Controllers
     * @protected
     */
    protected _controllers: IACLController[] = [];

    /**
     * Add controller
     * @param {IACLController} controller
     */
    public addController(controller: IACLController): void {
        this._controllers.push(controller);
    }

    /**
     * Check the access
     * @param {ACLRole} role
     * @param {ACLRight} right
     * @param {ACLRight[]} userRightList
     * @return {boolean}
     */
    public async checkAccess(role: ACLRole, right: ACLRight, userRightList?: ACLRight[]): Promise<boolean> {
        for (const controller of this._controllers) {
            if (await controller.checkAccess(role, right, userRightList)) {
                return true;
            }
        }

        return false;
    }

}