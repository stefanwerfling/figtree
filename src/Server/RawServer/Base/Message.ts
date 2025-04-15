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
     * @param {string|Buffer|Message} data
     */
    public constructor(data: string|Buffer|Message) {
        if (data instanceof Message) {
            this._data = data.getBuffer();
        } else {
            this._data = data;
        }
    }

    /**
     * Return a Buffer
     */
    public getBuffer(): Buffer {
        if (typeof this._data === 'string') {
            return Buffer.from(this._data, 'utf-8');
        }

        return this._data;
    }

    /**
     * Return the size of Message
     */
    public getSize(): number {
        if (typeof this._data === 'string') {
            return this._data.length;
        }

        return this._data.length;
    }

    /**
     * Return the Message Data
     * @returns {string|Buffer}
     */
    public getData(): string|Buffer {
        return this._data;
    }

}