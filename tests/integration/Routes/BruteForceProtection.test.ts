import {describe, it, expect, beforeAll} from 'vitest';
import express, {Application} from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import request from 'supertest';
import {DefaultRoute} from '../../../src/Server/HttpServer/Routes/DefaultRoute.js';
import {createBruteForceProtection} from '../../../src/Server/HttpServer/Routes/BruteForceProtection.js';
import {StatusCodes} from 'figtree-schemas';
import {Vts} from 'vts';

const SchemaResponse = Vts.object({
    statusCode: Vts.string()
});

class ProtectedRoute extends DefaultRoute {

    public getExpressRouter(): ReturnType<DefaultRoute['getExpressRouter']> {

        this._post(
            '/protected/login',
            false,
            async() => {
                return {statusCode: StatusCodes.OK};
            },
            {
                parser: createBruteForceProtection({limit: 3, windowMs: 60_000}),
                responseBodySchema: SchemaResponse
            }
        );

        return super.getExpressRouter();
    }

}

let app: Application;

beforeAll(() => {
    app = express();
    app.use(bodyParser.json());
    app.use(session({secret: 'test-secret', resave: false, saveUninitialized: false}));
    app.use(new ProtectedRoute().getExpressRouter());
});

describe('BruteForceProtection on POST /protected/login', () => {

    it('allows requests within the limit', async() => {
        for (let i = 0; i < 3; i++) {
            // sequential by design — testing rate-limit behavior requires ordered requests
            // eslint-disable-next-line no-await-in-loop
            const res = await request(app).post('/protected/login');
            expect(res.status).toBe(200);
        }
    });

    it('blocks requests after exceeding the limit', async() => {
        // 3 requests already sent above — next one should be blocked
        const res = await request(app).post('/protected/login');
        expect(res.status).toBe(429);
    });

    it('returns custom message on block', async() => {
        const res = await request(app).post('/protected/login');
        expect(res.body.msg).toBe('Too many attempts, please try again later.');
    });

});