import { HttpError, InfluxDB } from '@influxdata/influxdb-client';
import { hostname } from 'node:os';
import { Logger } from '../../Logger/Logger.js';
export class InfluxDbHelper {
    static _options = null;
    static _connection = null;
    static reset() {
        this._connection = null;
        this._options = null;
    }
    static async init(options) {
        this._options = options;
        const url = this._options.url;
        const token = this._options.token;
        this._connection = new InfluxDB({
            url: url,
            token: token
        });
    }
    static isConnected() {
        return Boolean(this._connection);
    }
    static getConnection() {
        if (!this._connection) {
            throw new Error('InfluxDbHelper: not initialized, call init() first');
        }
        return this._connection;
    }
    static getBucket() {
        if (!this._options) {
            throw new Error('InfluxDbHelper: not initialized, call init() first');
        }
        return this._options.bucket;
    }
    static _getWriter() {
        if (!this._options) {
            throw new Error('InfluxDbHelper: not initialized, call init() first');
        }
        const writeApi = InfluxDbHelper.getConnection().getWriteApi(this._options.org, this._options.bucket, 'ms');
        writeApi.useDefaultTags({ location: hostname() });
        return writeApi;
    }
    static _getQuery() {
        if (!this._options) {
            throw new Error('InfluxDbHelper: not initialized, call init() first');
        }
        return InfluxDbHelper.getConnection().getQueryApi(this._options.org);
    }
    static addPoint(apoint) {
        const writeApi = InfluxDbHelper._getWriter();
        writeApi.writePoint(apoint);
        writeApi.close().catch((e) => {
            if (Logger.hasLogger()) {
                Logger.getLogger().error('InfluxDbHelper::addPoint: Error: %s', e);
            }
            else {
                console.error(e);
            }
            if (e instanceof HttpError && e.statusCode === 401) {
                Logger.getLogger().error('InfluxDbHelper::addPoint: setup a new InfluxDB database');
            }
        });
    }
    static async readPoints(query) {
        const queryApi = InfluxDbHelper._getQuery();
        return queryApi.collectRows(query);
    }
}
//# sourceMappingURL=InfluxDbHelper.js.map