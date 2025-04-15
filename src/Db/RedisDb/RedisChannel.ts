import {EtsError} from 'ets';

/**
 * Default Redis channel
 */
export class RedisChannel<T> {

    /**
     * Name of a channel
     * @protected
     */
    protected _name: string;

    /**
     * Constructor
     * @param {string} name
     */
    public constructor(name: string) {
        this._name = name;
    }

    /**
     * Return the name of channel
     */
    public getName(): string {
        return this._name;
    }

    /**
     * Listen
     * @param {T} data
     */
    public async listen(data: T): Promise<void> {
        throw new EtsError(`RedisChannel::listen is not implemented! Data: ${JSON.stringify(data)}`);
    }

}