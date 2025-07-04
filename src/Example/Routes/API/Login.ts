import {Router} from 'express';
import {SchemaSessionData} from '../../../Schemas/Server/RequestData.js';
import {DefaultReturn, SchemaDefaultReturn} from '../../../Schemas/Server/Routes/DefaultReturn.js';
import {StatusCodes} from '../../../Schemas/Server/Routes/StatusCodes.js';
import {DefaultRoute} from '../../../Server/HttpServer/Routes/DefaultRoute.js';
import {DefaultRouteCheckUserIsLogin} from '../../../Server/HttpServer/Routes/DefaultRouteCheckUser.js';
import {Role} from '../../ACL/MyACLRbac.js';
import {
    IsLogin,
    SchemaIsLogin,
    SchemaIsLoginParameter,
    SchemaIsLoginParameterPath, SchemaLoginRequest
} from '../../Schemas/Routes/Login/Login.js';

export class Login extends DefaultRoute {

    /**
     * Base URL string
     */
    public static BASE = 'login';

    /**
     * Return the express router
     * @returns {Router}
     */
    public getExpressRouter(): Router {
        this._get(
            this._getUrl('v1', Login.BASE, 'islogin/:userid'),
            false,
            async(
                req,
                res,
                data
            ): Promise<IsLogin> => {

                // Your code -------------------------------------------------------------------------------------------
                // Handler todo start ----------------------------------------------------------------------------------

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

                // Handler todo end ----------------------------------------------------------------------------------
            },
            {
                description: 'Is a user login and return a status to the current session',
                responseBodySchema: SchemaIsLogin,
                querySchema: SchemaIsLoginParameter,
                pathSchema: SchemaIsLoginParameterPath
            }
        );

        this._post(
            this._getUrl('v1', Login.BASE, 'login/'),
            false,
            async(
                req,
                res,
                data
            ): Promise<DefaultReturn> => {
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
                    // This is only a sample, use bcrypt for password hash!
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
                bodySchema: SchemaLoginRequest,
                responseBodySchema: SchemaDefaultReturn,
                sessionSchema: SchemaSessionData
            }
        );

        return super.getExpressRouter();
    }

}