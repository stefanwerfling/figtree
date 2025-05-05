import { Logger as WinstonLogger } from 'winston';
export declare class Logger {
    static readonly DEFAULT_DIR = "/var/log/%s/";
    static readonly DEFAULT_FILENAME = "%s-%DATE%.log";
    static readonly DEFAULT_ZIPPED = false;
    static readonly DEFAULT_MAX_SIZE = "20m";
    static readonly DEFAULT_MAX_FILES = "14d";
    static readonly DEFAULT_LEVEL = "warn";
    static readonly DEFAULT_CONSOLE = true;
    protected static _logger: WinstonLogger | null;
    static hasLogger(): boolean;
    static cleanLogfiles(logPath: string, maxDays: number): Promise<void>;
    protected static _createLogger(): WinstonLogger;
    static getLogger(): WinstonLogger;
}
