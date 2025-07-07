import { ACLRbac } from '../../ACL/ACLRbac.js';
export declare const enum Role {
    root = "root",
    user = "user"
}
export declare const enum Right {
    service = "service",
    service_status = "service_status",
    service_start = "service_start",
    service_stop = "service_stop",
    invoices = "invoices",
    invoices_write = "invoices_write",
    invoices_read = "invoices_read",
    users = "users",
    users_read = "users_read"
}
export declare class MyACLRbac extends ACLRbac<Role, Right> {
    static ROLES: Role[];
    static RIGHTS: {
        service: {
            service_status: {};
            service_start: {};
            service_stop: {};
        };
        invoices: {
            invoices_read: {};
            invoices_write: {};
        };
        users: {
            users_read: {};
        };
    };
    static ASSOCIATIONS: {
        root: Right[];
        user: Right[];
    };
    constructor();
}
