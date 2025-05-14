import { StatusCodes } from '../../../Schemas/Server/Routes/StatusCodes.js';
import { DefaultRoute } from '../../../Server/HttpServer/Routes/DefaultRoute.js';
import { SchemaIsLogin } from '../../Schemas/Routes/Login/Login.js';
export class Login extends DefaultRoute {
    static BASE = 'login';
    getExpressRouter() {
        this._get(this._getUrl('v1', Login.BASE, 'islogin'), false, async (req, res, description) => {
            if (this.isUserLogin(req, res, false)) {
                res.status(200).json({
                    statusCode: StatusCodes.OK,
                    status: true
                });
            }
            else {
                res.status(200).json({
                    statusCode: StatusCodes.OK,
                    status: false
                });
            }
        }, {
            description: 'Is a user login and return a status to the current session',
            responseBodySchema: SchemaIsLogin
        });
        return super.getExpressRouter();
    }
}
//# sourceMappingURL=Login.js.map