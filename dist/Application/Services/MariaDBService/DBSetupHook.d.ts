export interface DBSetupHook {
    readonly id: string;
    readonly mode: 'once' | 'always';
    run(): Promise<void>;
}
