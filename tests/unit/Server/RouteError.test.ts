import {describe, it, expect} from 'vitest';
import {RouteError} from '../../../src/Server/HttpServer/Routes/RouteError.js';
import {StatusCodes} from 'figtree-schemas';

describe('RouteError', () => {

    it('is an instance of Error', () => {
        const err = new RouteError(StatusCodes.INTERNAL_ERROR, 'fail');
        expect(err).toBeInstanceOf(Error);
    });

    it('formats message as [status] msg', () => {
        const err = new RouteError(StatusCodes.INTERNAL_ERROR, 'something failed');
        expect(err.message).toBe(`[${StatusCodes.INTERNAL_ERROR}] something failed`);
    });

    it('getStatus returns the status code', () => {
        const err = new RouteError(StatusCodes.OK, 'ok');
        expect(err.getStatus()).toBe(StatusCodes.OK);
    });

    it('getRawMsg returns the raw message', () => {
        const err = new RouteError(StatusCodes.INTERNAL_ERROR, 'raw message');
        expect(err.getRawMsg()).toBe('raw message');
    });

    it('defaultReturn returns statusCode and msg', () => {
        const err = new RouteError(StatusCodes.INTERNAL_ERROR, 'detail');
        expect(err.defaultReturn()).toEqual({statusCode: StatusCodes.INTERNAL_ERROR, msg: 'detail'});
    });

    it('asJson returns true by default', () => {
        const err = new RouteError(StatusCodes.INTERNAL_ERROR, 'fail');
        expect(err.asJson()).toBe(true);
    });

    it('asJson returns false when explicitly set', () => {
        const err = new RouteError(StatusCodes.INTERNAL_ERROR, 'fail', false);
        expect(err.asJson()).toBe(false);
    });

});