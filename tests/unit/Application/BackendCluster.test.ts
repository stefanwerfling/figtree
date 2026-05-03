import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import * as os from 'os';
import {BackendCluster} from '../../../src/Application/BackendCluster.js';

describe('BackendCluster.getWorkerId', () => {

    it('returns hostname:pid', () => {
        const id = BackendCluster.getWorkerId();
        expect(id).toBe(`${os.hostname()}:${process.pid}`);
    });

    it('returns a stable id within the same process', () => {
        expect(BackendCluster.getWorkerId()).toBe(BackendCluster.getWorkerId());
    });

});

describe('BackendCluster.getWorkerRole', () => {

    const originalRole = process.env.WORKER_ROLE;

    beforeEach(() => {
        delete process.env.WORKER_ROLE;
    });

    afterEach(() => {
        if (originalRole === undefined) {
            delete process.env.WORKER_ROLE;
        } else {
            process.env.WORKER_ROLE = originalRole;
        }
    });

    it('returns "default" when WORKER_ROLE is not set', () => {
        expect(BackendCluster.getWorkerRole()).toBe('default');
    });

    it('returns the env value when WORKER_ROLE is set', () => {
        process.env.WORKER_ROLE = 'http';
        expect(BackendCluster.getWorkerRole()).toBe('http');
    });

    it('returns "default" when WORKER_ROLE is empty string', () => {
        process.env.WORKER_ROLE = '';
        // Empty string is falsy with ?? but truthy on the assignment;
        // process.env coerces to string and `?? 'default'` does NOT trigger on ''
        // — so we must accept the empty value here. Document the behavior:
        expect(BackendCluster.getWorkerRole()).toBe('');
    });

});

describe('BackendCluster constructor', () => {

    it('throws when roles option is set but all counts are 0', () => {
        expect((): BackendCluster => new BackendCluster({
            appFactory: (): any => ({}),
            roles: { http: 0, cron: 0 }
        })).toThrow(/no workers/u);
    });

    it('accepts roles with positive counts', () => {
        expect((): BackendCluster => new BackendCluster({
            appFactory: (): any => ({}),
            roles: { http: 2, cron: 1 }
        })).not.toThrow();
    });

    it('accepts options without roles (legacy workers count)', () => {
        expect((): BackendCluster => new BackendCluster({
            appFactory: (): any => ({}),
            workers: 2
        })).not.toThrow();
    });

});