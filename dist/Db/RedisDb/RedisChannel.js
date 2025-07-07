import { EtsError } from 'ets';
export class RedisChannel {
    _name;
    constructor(name) {
        this._name = name;
    }
    getName() {
        return this._name;
    }
    async listen(data) {
        throw new EtsError(`RedisChannel::listen is not implemented! Data: ${JSON.stringify(data)}`);
    }
}
//# sourceMappingURL=RedisChannel.js.map