/**
 * Message
 */
export class Message {

    /**
     * Data
     * @protected
     */
    protected _data: string|Buffer;

    /**
     * Create a message instance
     * @param {string|Buffer} data
     */
    public constructor(data: string|Buffer) {
        this._data = data;
    }

    /**
     * Return the Message Data
     * @returns {string|Buffer}
     */
    public getData(): string|Buffer {
        return this._data;
    }

}