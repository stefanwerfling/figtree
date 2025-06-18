import { SchemaRequestData } from '../../../Schemas/Server/RequestData.js';
import { StatusCodes } from '../../../Schemas/Server/Routes/StatusCodes.js';
import { Session } from '../Session.js';
import { RequestContext } from './RequestContext.js';
import { RouteError } from './RouteError.js';
export const DefaultRouteCheckUserIsLogin = (req, sendAutoResoonse = true) => {
    if (SchemaRequestData.validate(req, [])) {
        if (Session.isUserLogin(req.session)) {
            return true;
        }
        if (RequestContext.hasInstance()) {
            RequestContext.getInstance().set(RequestContext.SESSIONID, req.session.id);
            RequestContext.getInstance().set(RequestContext.USERID, '');
            RequestContext.getInstance().set(RequestContext.ISLOGIN, false);
            if (req.session.user) {
                RequestContext.getInstance().set(RequestContext.USERID, req.session.user.userid);
                RequestContext.getInstance().set(RequestContext.ISLOGIN, req.session.user.isLogin);
                RequestContext.getInstance().set(RequestContext.ISLOGIN, true);
            }
        }
    }
    if (sendAutoResoonse) {
        throw new RouteError(StatusCodes.UNAUTHORIZED, 'User is unauthorized!');
    }
    return false;
};
//# sourceMappingURL=DefaultRouteCheckUser.js.map