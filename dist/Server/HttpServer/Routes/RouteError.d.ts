import { DefaultReturn } from 'figtree-schemas';
export declare class RouteError extends Error {
    protected _status: string;
    protected _msg: string;
    protected _returnAsJson: boolean;
    constructor(status: string, msg: string, returnAsJson?: boolean);
    asJson(): boolean;
    defaultReturn(): DefaultReturn;
    getStatus(): string;
    getRawMsg(): string;
}
