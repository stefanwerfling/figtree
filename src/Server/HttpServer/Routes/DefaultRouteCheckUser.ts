import {Request, Response} from 'express';
import {RequestData, SchemaRequestData, StatusCodes} from 'figtree_schemas';
import {ACL} from '../../../ACL/ACL.js';
import {Session} from '../Session.js';
import {RequestContext} from './RequestContext.js';
import {RouteError} from './RouteError.js';

/**
 * Type of Default route check user login
 */
export type DefaultRouteCheckUserLogin<
    REQ extends Request = Request,
    RESP extends Response = Response
> = (
    request: REQ,
    response: RESP,
    aclRight?: string
) => Promise<boolean>;

/**
 * Default function for check is a user logged in and acl
 * @param {unknown} req
 * @param {Response} res
 * @param {[aclRight]} aclRight
 * @constructor
 */
export const DefaultRouteCheckUserIsLoginACL = async (
    req: unknown,
    res: Response,
    aclRight?: string
): Promise<boolean> => {
    if (!DefaultRouteCheckUserIsLogin(req, true)) {
        return false;
    }

    if (aclRight && req.session.user && req.session.user.role) {
        const role = req.session.user.role;

        if (await ACL.getInstance().checkAccess(role, aclRight)) {
            return true;
        }
    }

    throw new RouteError(StatusCodes.FORBIDDEN, 'User has no access!');
};

/**
 * Default function for check is a user logged in
 * @param {unknown} req
 * @param {boolean} sendAutoResoonse
 * @constructor
 * @throws RouteError
 */
export const DefaultRouteCheckUserIsLogin = (
    req: unknown,
    sendAutoResoonse: boolean = true
): req is RequestData =>  {
    if (SchemaRequestData.validate(req, [])) {
        if (RequestContext.hasInstance()) {
            RequestContext.getInstance().set(RequestContext.SESSIONID, req.session.id);
            RequestContext.getInstance().set(RequestContext.USERID, '');
            RequestContext.getInstance().set(RequestContext.ISLOGIN, false);
        }

        if (Session.isUserLogin(req.session)) {
            if (RequestContext.hasInstance()) {
                if (req.session.user) {
                    RequestContext.getInstance().set(RequestContext.USERID, req.session.user.userid);
                    RequestContext.getInstance().set(RequestContext.ISLOGIN, req.session.user.isLogin);
                }
            }

            return true;
        }
    }

    if (sendAutoResoonse) {
        throw new RouteError(StatusCodes.UNAUTHORIZED, 'User is unauthorized!');
    }

    return false;
}