export class ACLRbac {
    _rbac;
    async checkAccess(role, right) {
        if (this._rbac) {
            return this._rbac.checkAccess(role, right);
        }
        return false;
    }
}
//# sourceMappingURL=ACLRbac.js.map