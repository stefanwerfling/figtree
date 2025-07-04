import {Rbac} from 'rbac-simple';
import {ACLRbac} from '../../ACL/ACLRbac.js';

export const enum Role {
    root = 'root',
    user = 'user'
}

export const enum Right {
    service = 'service',
    service_status = 'service_status',
    service_start = 'service_start',
    service_stop = 'service_stop',
    invoices = 'invoices',
    invoices_write = 'invoices_write',
    invoices_read = 'invoices_read',
    users = 'users',
    users_read = 'users_read'
}

export class MyACLRbac extends ACLRbac<Role, Right> {

    public static ROLES = [
        Role.root,
        Role.user
    ];

    public static RIGHTS = {
        [Right.service]: {
            [Right.service_status]: {},
            [Right.service_start]: {},
            [Right.service_stop]: {}
        },
        [Right.invoices]: {
            [Right.invoices_read]: {},
            [Right.invoices_write]: {}
        },
        [Right.users]: {
            [Right.users_read]: {}
        }
    };

    public static ASSOCIATIONS = {
        [Role.root]: [
            Right.service,
            Right.invoices_write,
            Right.invoices_read
        ],
        [Role.user]: [
            Right.users,
            Right.service_status
        ]
    };

    public constructor() {
        super();

        this._rbac = new Rbac<Role, Right>(
            MyACLRbac.ROLES,
            MyACLRbac.RIGHTS,
            MyACLRbac.ASSOCIATIONS
        );
    }
}