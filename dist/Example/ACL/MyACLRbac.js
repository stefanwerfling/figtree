import { Rbac } from 'rbac-simple';
import { ACLRbac } from '../../ACL/ACLRbac.js';
export class MyACLRbac extends ACLRbac {
    static ROLES = [
        "root",
        "user"
    ];
    static RIGHTS = {
        ["service"]: {
            ["service_status"]: {},
            ["service_start"]: {},
            ["service_stop"]: {}
        },
        ["invoices"]: {
            ["invoices_read"]: {},
            ["invoices_write"]: {}
        },
        ["users"]: {
            ["users_read"]: {}
        }
    };
    static ASSOCIATIONS = {
        ["root"]: [
            "service",
            "invoices_write",
            "invoices_read"
        ],
        ["user"]: [
            "users",
            "service_status",
            "service_stop"
        ]
    };
    constructor() {
        super();
        this._rbac = new Rbac(MyACLRbac.ROLES, MyACLRbac.RIGHTS, MyACLRbac.ASSOCIATIONS);
    }
}
//# sourceMappingURL=MyACLRbac.js.map