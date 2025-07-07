export declare class RedisChannel<T> {
    protected _name: string;
    constructor(name: string);
    getName(): string;
    listen(data: T): Promise<void>;
}
