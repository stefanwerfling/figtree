import { StatusCodes } from '../../../Schemas/Server/Routes/StatusCodes.js';
import { DefaultRoute } from '../../../Server/HttpServer/Routes/DefaultRoute.js';
import { DefaultRouteCheckUserIsLogin } from '../../../Server/HttpServer/Routes/DefaultRouteCheckUser.js';
import { SchemaIsLogin, SchemaIsLoginParameter, SchemaIsLoginParameterPath } from '../../Schemas/Routes/Login/Login.js';
export class Login extends DefaultRoute {
    static BASE = 'login';
    getExpressRouter() {
        this._get(this._getUrl('v1', Login.BASE, 'islogin/:userid'), false, async (req, res, data) => {
            if (DefaultRouteCheckUserIsLogin(req, false)) {
                return {
                    statusCode: StatusCodes.OK,
                    status: true
                };
            }
            return {
                statusCode: StatusCodes.OK,
                status: false
            };
        }, {
            description: 'Is a user login and return a status to the current session',
            responseBodySchema: SchemaIsLogin,
            querySchema: SchemaIsLoginParameter,
            pathSchema: SchemaIsLoginParameterPath
        });
        return super.getExpressRouter();
    }
}
//# sourceMappingURL=Login.js.map