import { Request, Response } from 'express';
import { RequestData } from '../../../Schemas/Server/RequestData.js';
export type DefaultRouteCheckUserLogin<REQ extends Request = Request, RESP extends Response = Response> = (request: REQ, response: RESP) => Promise<boolean>;
export declare const DefaultRouteCheckUserIsLogin: (req: unknown, sendAutoResoonse?: boolean) => req is RequestData;
