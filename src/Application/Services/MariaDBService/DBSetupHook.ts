/**
 * DB Setup hook
 */
export interface DBSetupHook {

    /**
     * Setup id
     */
    readonly id: string;

    /**
     * Setup mode
     */
    readonly mode: 'once' | 'always';

    /**
     * Run a setup
     */
    run(): Promise<void>;

}