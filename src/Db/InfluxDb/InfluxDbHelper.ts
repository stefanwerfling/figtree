import {HttpError, InfluxDB, ParameterizedQuery, Point, QueryApi, WriteApi} from '@influxdata/influxdb-client';
import {hostname} from 'node:os';
import {Logger} from '../../Logger/Logger.js';

/**
 * InfluxDbHelperOptions
 */
export type InfluxDbHelperOptions = {
    url: string;
    token: string;
    org: string;
    bucket: string;
};

/**
 * InfluxDbHelper
 */
export class InfluxDbHelper {

    /**
     * options
     * @private
     */
    private static _options: InfluxDbHelperOptions;

    /**
     * connection
     * @private
     */
    private static _connection: InfluxDB;

    /**
     * init
     * @param {InfluxDbHelperOptions} options
     */
    public static async init(options: InfluxDbHelperOptions): Promise<void> {
        this._options = options;

        const url = this._options.url;
        const token = this._options.token;

        this._connection = new InfluxDB({
            url: url,
            token: token
        });
    }

    /**
     * Is connected
     * @return {boolean}
     */
    public static isConnected(): boolean {
        return Boolean(this._connection);
    }

    /**
     * Get connection
     * @return {InfluxDB}
     */
    public static getConnection(): InfluxDB {
        return this._connection;
    }

    /**
     * Get bucket
     * @return {string}
     */
    public static getBucket(): string {
        return this._options.bucket;
    }

    /**
     * _getWriter
     * @protected
     * @return {WriteApi}
     */
    protected static _getWriter(): WriteApi {
        const writeApi = InfluxDbHelper.getConnection().getWriteApi(
            InfluxDbHelper._options.org,
            InfluxDbHelper._options.bucket,
            'ms'
        );

        writeApi.useDefaultTags({location: hostname()});

        return writeApi;
    }

    /**
     * _getQuery
     * @protected
     * @return {QueryApi}
     */
    protected static _getQuery(): QueryApi {
        return InfluxDbHelper.getConnection().getQueryApi(
            InfluxDbHelper._options.org
        );
    }

    /**
     * Add point
     * @param {Point} apoint
     */
    public static addPoint(apoint: Point): void {
        const writeApi = InfluxDbHelper._getWriter();

        writeApi.writePoint(apoint);

        writeApi.close().catch((e) => {
            if (Logger.hasLogger()) {
                Logger.getLogger().error('InfluxDbHelper::addPoint: Error: %s', e);
            } else {
                console.error(e);
            }

            if (e instanceof HttpError && e.statusCode === 401) {
                Logger.getLogger().error('InfluxDbHelper::addPoint: setup a new InfluxDB database');
            }
        });
    }

    /**
     * readPoints
     * @param {ParameterizedQuery} query
     * @return {{ [p: string]: any; }[]}
     */
    public static async readPoints(query: ParameterizedQuery): Promise<{ [p: string]: any; }[]> {
        const queryApi = InfluxDbHelper._getQuery();
        return queryApi.collectRows(query);
    }

}