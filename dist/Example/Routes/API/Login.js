import { SchemaDefaultReturn, SchemaSessionData, StatusCodes } from 'figtree_schemas';
import { DefaultRoute } from '../../../Server/HttpServer/Routes/DefaultRoute.js';
import { DefaultRouteCheckUserIsLogin } from '../../../Server/HttpServer/Routes/DefaultRouteCheckUser.js';
import { SchemaIsLogin, SchemaIsLoginParameter, SchemaIsLoginParameterPath, SchemaLoginRequest } from '../../Schemas/Routes/Login/Login.js';
export class Login extends DefaultRoute {
    static BASE = 'login';
    getExpressRouter() {
        this._get(this._getUrl('v1', Login.BASE, 'islogin/:userid'), false, async (req, _res, _data) => {
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
            pathSchema: SchemaIsLoginParameterPath,
            useLocalStorage: true
        });
        this._post(this._getUrl('v1', Login.BASE, 'login/'), false, async (_req, _res, data) => {
            if (!data.session) {
                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'None session found!'
                };
            }
            data.session.user = {
                isLogin: false,
                userid: '',
                role: ''
            };
            if (data.body) {
                if (data.body.username === 'test' && data.body.password === '1234') {
                    data.session.user.userid = 'uuid-1234';
                    data.session.user.isLogin = true;
                    data.session.user.role = "user";
                    return {
                        statusCode: StatusCodes.OK
                    };
                }
            }
            return {
                statusCode: StatusCodes.INTERNAL_ERROR,
                msg: 'Login request is empty or wrong posted!'
            };
        }, {
            description: 'Login user and write session data',
            bodySchema: SchemaLoginRequest,
            responseBodySchema: SchemaDefaultReturn,
            sessionSchema: SchemaSessionData
        });
        return super.getExpressRouter();
    }
}
//# sourceMappingURL=Login.js.map