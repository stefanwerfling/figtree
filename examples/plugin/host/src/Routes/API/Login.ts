import {Router} from 'express';
import {DefaultReturn, SchemaDefaultReturn, SchemaSessionData, StatusCodes} from 'figtree-schemas';
import {createBruteForceProtection, DefaultRoute, DefaultRouteCheckUserIsLogin} from 'figtree';
import {Role} from '../../ACL/MyACLRbac.js';
import {
    IsLogin,
    SchemaIsLogin,
    SchemaIsLoginParameter,
    SchemaIsLoginParameterPath,
    SchemaLoginRequest
} from '../../Schemas/Routes/Login/Login.js';

/**
 * Login Example route
 */
export class Login extends DefaultRoute {

    public static BASE = 'login';

    public getExpressRouter(): Router {
        this._get(
            this._getUrl('v1', Login.BASE, 'islogin/:userid'),
            false,
            async(req, _res, _data): Promise<IsLogin> => {
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
            },
            {
                description: 'Is a user login and return a status to the current session',
                responseBodySchema: SchemaIsLogin,
                querySchema: SchemaIsLoginParameter,
                pathSchema: SchemaIsLoginParameterPath,
                useLocalStorage: true
            }
        );

        this._post(
            this._getUrl('v1', Login.BASE, 'login/'),
            false,
            async(_req, _res, data): Promise<DefaultReturn> => {
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
                    // Demo only — use bcrypt for password hashing in real code!
                    if (data.body.username === 'test' && data.body.password === '1234') {
                        data.session.user.userid = 'uuid-1234';
                        data.session.user.isLogin = true;
                        data.session.user.role = Role.user;

                        return {
                            statusCode: StatusCodes.OK
                        };
                    }
                }

                return {
                    statusCode: StatusCodes.INTERNAL_ERROR,
                    msg: 'Login request is empty or wrong posted!'
                };
            },
            {
                description: 'Login user and write session data',
                parser: createBruteForceProtection({ limit: 10 }),
                bodySchema: SchemaLoginRequest,
                responseBodySchema: SchemaDefaultReturn,
                sessionSchema: SchemaSessionData
            }
        );

        return super.getExpressRouter();
    }

}