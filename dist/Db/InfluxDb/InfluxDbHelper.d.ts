import { InfluxDB, ParameterizedQuery, Point, QueryApi, WriteApi } from '@influxdata/influxdb-client';
export type InfluxDbHelperOptions = {
    url: string;
    token: string;
    org: string;
    bucket: string;
};
export declare class InfluxDbHelper {
    private static _options;
    private static _connection;
    static init(options: InfluxDbHelperOptions): Promise<void>;
    static isConnected(): boolean;
    static getConnection(): InfluxDB;
    static getBucket(): string;
    protected static _getWriter(): WriteApi;
    protected static _getQuery(): QueryApi;
    static addPoint(apoint: Point): void;
    static readPoints(query: ParameterizedQuery): Promise<{
        [p: string]: any;
    }[]>;
}
