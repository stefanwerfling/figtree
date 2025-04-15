export declare class Message {
    protected _data: string | Buffer;
    constructor(data: string | Buffer | Message);
    getBuffer(): Buffer;
    getSize(): number;
    getData(): string | Buffer;
}
