/// <reference types="node" resolution-mode="require"/>
export declare class Message {
    protected _data: string | Buffer;
    constructor(data: string | Buffer);
    getData(): string | Buffer;
}
