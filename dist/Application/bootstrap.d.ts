import { BackendApp } from './BackendApp.js';
export type BootstrapOptions = {
    configFile?: string;
};
export type BootstrapResult = {
    start(): Promise<void>;
};
export declare const bootstrap: (appFactory: () => BackendApp<any, any>, options?: BootstrapOptions) => Promise<BootstrapResult>;
