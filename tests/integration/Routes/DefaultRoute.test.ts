import {describe, it, expect, beforeAll} from 'vitest';
import express, {Application} from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import request from 'supertest';
import {DefaultRoute} from '../../../src/Server/HttpServer/Routes/DefaultRoute.js';
import {RouteError} from '../../../src/Server/HttpServer/Routes/RouteError.js';
import {Vts} from 'vts';
import {StatusCodes} from 'figtree-schemas';

// ---- Schemas ----------------------------------------------------------------

const SchemaBody = Vts.object({
    name: Vts.string()
});

const SchemaResponse = Vts.object({
    statusCode: Vts.string(),
    msg: Vts.optional(Vts.string())
});

const SchemaQuery = Vts.object({
    q: Vts.string()
});

// ---- Test Route -------------------------------------------------------------

class TestRoute extends DefaultRoute {
    public getExpressRouter() {

        this._get(
            '/test/hello',
            false,
            async() => {
                return {statusCode: StatusCodes.OK, msg: 'hello'};
            },
            {
                responseBodySchema: SchemaResponse
            }
        );

        this._post(
            '/test/echo',
            false,
            async(_req, _res, data) => {
                return {statusCode: StatusCodes.OK, msg: data.body?.name ?? ''};
            },
            {
                bodySchema: SchemaBody,
                responseBodySchema: SchemaResponse
            }
        );

        this._get(
            '/test/query',
            false,
            async(_req, _res, data) => {
                return {statusCode: StatusCodes.OK, msg: data.query?.q ?? ''};
            },
            {
                querySchema: SchemaQuery,
                responseBodySchema: SchemaResponse
            }
        );

        this._post(
            '/test/error',
            false,
            async() => {
                throw new RouteError(StatusCodes.INTERNAL_ERROR, 'something failed');
            },
            {
                responseBodySchema: SchemaResponse
            }
        );

        this._post(
            '/test/no-response-schema',
            false,
            async() => {
                return {statusCode: StatusCodes.OK};
            },
            {}
        );

        return super.getExpressRouter();
    }
}

// ---- App Setup --------------------------------------------------------------

let app: Application;

beforeAll(() => {
    app = express();
    app.use(bodyParser.json());
    app.use(session({secret: 'test-secret', resave: false, saveUninitialized: false}));
    app.use(new TestRoute().getExpressRouter());
});

// ---- Tests ------------------------------------------------------------------

describe('DefaultRoute GET /test/hello', () => {

    it('returns 200 with response body', async() => {
        const res = await request(app).get('/test/hello');
        expect(res.status).toBe(200);
        expect(res.body.statusCode).toBe(StatusCodes.OK);
        expect(res.body.msg).toBe('hello');
    });

});

describe('DefaultRoute POST /test/echo', () => {

    it('returns echoed body field', async() => {
        const res = await request(app)
            .post('/test/echo')
            .send({name: 'FigTree'})
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(200);
        expect(res.body.msg).toBe('FigTree');
    });

    it('returns 200 with INTERNAL_ERROR on invalid body schema', async() => {
        const res = await request(app)
            .post('/test/echo')
            .send({wrong: 'field'})
            .set('Content-Type', 'application/json');

        expect(res.status).toBe(200);
        expect(res.body.statusCode).toBe(StatusCodes.INTERNAL_ERROR);
    });

});

describe('DefaultRoute GET /test/query', () => {

    it('returns query parameter in response', async() => {
        const res = await request(app).get('/test/query?q=hello');
        expect(res.status).toBe(200);
        expect(res.body.msg).toBe('hello');
    });

    it('returns INTERNAL_ERROR when required query param is missing', async() => {
        const res = await request(app).get('/test/query');
        expect(res.status).toBe(200);
        expect(res.body.statusCode).toBe(StatusCodes.INTERNAL_ERROR);
    });

});

describe('DefaultRoute POST /test/error', () => {

    it('returns RouteError as JSON with statusCode', async() => {
        const res = await request(app).post('/test/error');
        expect(res.status).toBe(200);
        expect(res.body.statusCode).toBe(StatusCodes.INTERNAL_ERROR);
        expect(res.body.msg).toBe('something failed');
    });

});

describe('DefaultRoute POST /test/no-response-schema', () => {

    it('returns 204 when no responseBodySchema is set', async() => {
        const res = await request(app).post('/test/no-response-schema');
        expect(res.status).toBe(204);
    });

});