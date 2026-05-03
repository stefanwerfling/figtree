import { ValueTransformer } from 'typeorm';
export declare class EncryptionTransformer implements ValueTransformer {
    to(_value: string): string;
    from(_value: string): string;
}
