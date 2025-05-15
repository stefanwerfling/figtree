import {DefaultReturn} from '../../../Schemas/Server/Routes/DefaultReturn.js';

/**
 * Route Error
 */
export class RouteError extends Error {

    /**
     * Status
     * @protected
     */
    protected _status: string;

    /**
     * Message
     * @protected
     */
    protected _msg: string;

    /**
     * Flag how is return this error
     * @protected
     */
    protected _returnAsJson: boolean;

    /**
     * Constructor
     * @param {number} status
     * @param {string} msg
     * @param {boolean} returnAsJson
     */
    public constructor(status: string, msg: string, returnAsJson: boolean = true) {
        super(`[${status}] ${msg}`);
        this._status = status;
        this._msg = msg;
        this._returnAsJson = returnAsJson;
    }

    /**
     * Is Error return as Json
     */
    public asJson(): boolean {
        return this._returnAsJson;
    }

    /**
     * Return the DefaultReturn message schema
     * @return {DefaultReturn}
     */
    public defaultReturn(): DefaultReturn {
        return {
            statusCode: this._status,
            msg: this._msg
        }
    }

    /**
     * Return the status
     * @return {number}
     */
    public getStatus(): string {
        return this._status;
    }

    /**
     * Return single message (raw)
     * @return {string}
     */
    public getRawMsg(): string {
        return this._msg;
    }

}