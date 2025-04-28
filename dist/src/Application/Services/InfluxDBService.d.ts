import { ServiceAbstract } from '../../Service/ServiceAbstract.js';
export declare class InfluxDBService extends ServiceAbstract {
    start(): Promise<void>;
    stop(forced?: boolean): Promise<void>;
}
