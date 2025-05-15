import {Router} from 'express';
import {StatusCodes} from '../../../Schemas/Server/Routes/StatusCodes.js';
import {DefaultRoute} from '../../../Server/HttpServer/Routes/DefaultRoute.js';
import {
    IsLogin,
    SchemaIsLogin,
    SchemaIsLoginParameter,
    SchemaIsLoginParameterPath
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

                if (this.isUserLogin(req, res, false)) {
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

        return super.getExpressRouter();
    }

}