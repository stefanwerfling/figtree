export class ACL {
    static _instance = null;
    static getInstance() {
        if (this._instance === null) {
            this._instance = new ACL();
        }
        return this._instance;
    }
    _controllers = [];
    addController(controller) {
        this._controllers.push(controller);
    }
    async checkAccess(role, right, userRightList) {
        for (const controller of this._controllers) {
            if (await controller.checkAccess(role, right, userRightList)) {
                return true;
            }
        }
        return false;
    }
}
//# sourceMappingURL=ACL.js.map