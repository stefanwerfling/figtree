import { ObjectSchema } from 'vts';
import { ConfigOptions } from '../Schemas/Config/ConfigOptions.js';
export declare class Config<T extends ConfigOptions = ConfigOptions> {
    static readonly DEFAULT_CONFIG_FILE = "config.json";
    static readonly DEFAULT_DIR: string;
    protected static _instance: Config;
    static getInstance(): Config;
    protected _schema: ObjectSchema<any> | null;
    private _appName;
    private _appTitle;
    protected _config: T | null;
    protected constructor(schema: ObjectSchema<any>);
    setAppName(name: string): void;
    getAppName(): string | null;
    setAppTitle(title: string): void;
    getAppTitle(): string;
    set(aConfig: T | null): void;
    get(): T | null;
    load(configFile?: string | null, useEnv?: boolean): Promise<T | null>;
    protected _loadEnv(config: T | null): T | null;
    protected _setDefaults(config: T | null): T | null;
}
