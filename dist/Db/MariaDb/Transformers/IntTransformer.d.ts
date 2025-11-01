import { ValueTransformer } from 'typeorm';
export declare class IntTransformer implements ValueTransformer {
    from(val: unknown): string | null;
    to(val: unknown): number | null;
}
