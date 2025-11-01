import { ValueTransformer } from 'typeorm';
export declare class EncryptionTransformer implements ValueTransformer {
    to(value: string): string;
    from(value: string): string;
}
