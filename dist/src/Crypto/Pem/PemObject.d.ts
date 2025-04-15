export declare class PemObject {
    static readonly preEncapsulationBoundaryRegex: RegExp;
    static readonly postEncapsulationBoundaryRegex: RegExp;
    static readonly base64LineRegex: RegExp;
    static readonly pemObjectRegex: RegExp;
    static validateLabel(label: string): void;
    static parse(text: string): PemObject[];
    private _label;
    data: Uint8Array;
    constructor(label?: string, data?: string | Uint8Array);
    getLabel(): string;
    setLabel(value: string): void;
    hasRFC7468CompliantLabel(): boolean;
    getPreEncapsulationBoundary(): string;
    getPostEncapsulationBoundary(): string;
    getEncapsulatedTextPortion(): string;
    encoded(): string;
    decode(encoded: string): void;
}
