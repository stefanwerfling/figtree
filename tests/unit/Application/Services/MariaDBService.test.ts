import {DataSource} from 'typeorm';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {DBHelper} from '../../../../src/Db/MariaDb/DBHelper.js';
import {MariaDBService} from '../../../../src/Application/Services/MariaDBService.js';

/**
 * Minimal DBLoader stub — `healthCheck()` never touches the loader,
 * but the constructor requires one.
 */
const stubLoader = {
    loadEntities: async(): Promise<unknown[]> => [],
    loadMigrations: (): unknown[] => []
};

describe('MariaDBService.healthCheck', () => {

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns true when SELECT 1 succeeds', async() => {
        const fakeDs = {
            query: vi.fn().mockResolvedValue([{1: 1}])
        } as unknown as DataSource;
        vi.spyOn(DBHelper, 'getDataSource').mockResolvedValue(fakeDs);

        const svc = new MariaDBService(stubLoader);

        await expect(svc.healthCheck()).resolves.toBe(true);
        expect(fakeDs.query).toHaveBeenCalledWith('SELECT 1');
    });

    it('returns false when getDataSource() rejects', async() => {
        vi.spyOn(DBHelper, 'getDataSource').mockRejectedValue(new Error('ECONNREFUSED'));

        const svc = new MariaDBService(stubLoader);

        await expect(svc.healthCheck()).resolves.toBe(false);
    });

    it('returns false when query() rejects', async() => {
        const fakeDs = {
            query: vi.fn().mockRejectedValue(new Error('connection lost'))
        } as unknown as DataSource;
        vi.spyOn(DBHelper, 'getDataSource').mockResolvedValue(fakeDs);

        const svc = new MariaDBService(stubLoader);

        await expect(svc.healthCheck()).resolves.toBe(false);
    });

});