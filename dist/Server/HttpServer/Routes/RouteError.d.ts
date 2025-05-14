import { DefaultReturn } from '../../../Schemas/Server/Routes/DefaultReturn.js';
export declare class RouteError extends Error {
    protected _status: number;
    protected _msg: string;
    protected _returnAsJson: boolean;
    constructor(status: number, msg: string, returnAsJson?: boolean);
    asJson(): boolean;
    defaultReturn(): DefaultReturn;
    getStatus(): number;
    getRawMsg(): string;
}
