import { ValueTransformer } from 'typeorm';
export declare class DecimalTransformer implements ValueTransformer {
    to(value: string): number;
    from(value: number | null): string;
}
