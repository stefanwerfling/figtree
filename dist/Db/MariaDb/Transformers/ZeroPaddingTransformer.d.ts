import { ValueTransformer } from 'typeorm';
export declare class ZeroPadding15Transformer implements ValueTransformer {
    to(value: string | null): string | null;
    from(value: string | null): string | null;
}
