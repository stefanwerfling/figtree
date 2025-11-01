import { ValueTransformer } from 'typeorm';
export declare class BoolTransformer implements ValueTransformer {
    from(value: unknown): boolean;
    to(value: unknown): number;
}
