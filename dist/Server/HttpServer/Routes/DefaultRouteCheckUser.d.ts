import { Request, Response } from 'express';
import { RequestData } from '../../../Schemas/Server/RequestData.js';
export type DefaultRouteCheckUserLogin<REQ extends Request = Request, RESP extends Response = Response> = (request: REQ, response: RESP, aclRight?: string) => Promise<boolean>;
export declare const DefaultRouteCheckUserIsLoginACL: (req: unknown, res: Response, aclRight?: string) => Promise<boolean>;
export declare const DefaultRouteCheckUserIsLogin: (req: unknown, sendAutoResoonse?: boolean) => req is RequestData;
