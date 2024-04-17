export class Message {
    _data;
    constructor(data) {
        if (data instanceof Message) {
            this._data = data.getBuffer();
        }
        else {
            this._data = data;
        }
    }
    getBuffer() {
        if (typeof this._data === 'string') {
            return Buffer.from(this._data, 'utf-8');
        }
        return this._data;
    }
    getSize() {
        if (typeof this._data === 'string') {
            return this._data.length;
        }
        return this._data.length;
    }
    getData() {
        return this._data;
    }
}
//# sourceMappingURL=Message.js.map