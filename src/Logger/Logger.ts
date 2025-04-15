import * as path from 'path';
import util from 'util';
import {Config} from '../Config/Config.js';
import {DirHelper} from '../Utils/DirHelper.js';
import {FileHelper} from '../Utils/FileHelper.js';
import winston, {Logger as WinstonLogger} from 'winston';
import TransportStream from 'winston-transport';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * Logger
 */
export class Logger {

    public static readonly DEFAULT_DIR = '/var/log/%s/';
    public static readonly DEFAULT_FILENAME = '%s-%DATE%.log';
    public static readonly DEFAULT_ZIPPED = false;
    public static readonly DEFAULT_MAX_SIZE = '20m';
    public static readonly DEFAULT_MAX_FILES = '14d';
    public static readonly DEFAULT_LEVEL = 'warn';
    public static readonly DEFAULT_CONSOLE = true;

    /**
     * winston logger
     * @protected
     */
    protected static _logger: WinstonLogger|null = null;

    /**
     * Has a Logger instance
     * @return {boolean}
     */
    public static hasLogger(): boolean {
        return Logger._logger !== null;
    }

    /**
     * Clean log files
     * @param {string} logPath
     * @param {number} maxDays
     */
    public static async cleanLogfiles(logPath: string, maxDays: number): Promise<void> {
        const files = await DirHelper.getFiles(logPath);

        for await (const file of files) {
            try {
                const filePath = path.join(logPath, file);

                const isOlder = await FileHelper.isOlderHours(
                    filePath,
                    maxDays * 24,
                );

                if (isOlder) {
                    await FileHelper.fileDelete(filePath);
                    console.info('Delete old log file: ', filePath);
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    }

    protected static _createLogger(): WinstonLogger {
        const config = Config.getInstance().get();

        const appName = Config.getInstance().getAppName() ?? 'app';

        let dirname = util.format(Logger.DEFAULT_DIR, appName);
        let filename = util.format(Logger.DEFAULT_FILENAME, appName);
        let zippedArchive = Logger.DEFAULT_ZIPPED;
        let maxSize = Logger.DEFAULT_MAX_SIZE;
        let maxFiles = Logger.DEFAULT_MAX_FILES;
        let level = Logger.DEFAULT_LEVEL;
        let enableConsole = Logger.DEFAULT_CONSOLE;

        if (config !== null) {
            if (config.logging) {
                if (config.logging.dirname) {
                    dirname = config.logging.dirname;
                }

                if (config.logging.filename) {
                    filename = config.logging.filename;
                }

                if (config.logging.zippedArchive) {
                    zippedArchive = config.logging.zippedArchive;
                }

                if (config.logging.maxSize) {
                    maxSize = config.logging.maxSize;
                }

                if (config.logging.maxFiles) {
                    maxFiles = config.logging.maxFiles;
                }

                if (config.logging.level) {
                    level = config.logging.level;
                }

                if (config.logging.enableConsole) {
                    enableConsole = config.logging.enableConsole;
                }
            }
        }

        // Clean old logs ------------------------------------------------------------------------------------------

        Logger.cleanLogfiles(dirname, parseInt(maxFiles, 10)).then();

        // ---------------------------------------------------------------------------------------------------------

        const transports: TransportStream[] = [];

        try {
            const dRFtransport: DailyRotateFile = new DailyRotateFile({
                dirname: dirname,
                filename: filename,
                datePattern: 'YYYY-MM-DD-HH',
                zippedArchive: zippedArchive,
                maxSize: maxSize,
                maxFiles: maxFiles,

            });

            dRFtransport.on(
                'rotate',
                (
                    oldFilename,
                    newFilename
                ) => {
                    console.log(`Logger::_createLogger: Change loggingfile: ${oldFilename} --> ${newFilename}`);
                }
            );

            transports.push(dRFtransport);
        } catch (e) {
            console.error(e);
            enableConsole = true;
        }

        if (enableConsole) {
            transports.push(new winston.transports.Console({
                handleExceptions: true
            }));
        }

        const { combine, timestamp, splat, json } = winston.format;

        const logger = winston.createLogger({
            level: level,
            format: combine(timestamp(), splat(), json()),
            transports: transports
        });

        console.log('Logger::_createLogger: Create Logger with:');
        console.log(`Logger::_createLogger:   * Level: ${level}`);

        let transStr = '';

        for (const ttransport of transports) {
            if (transStr.length > 0) {
                transStr += ', ';
            }

            transStr += `${ttransport.constructor.name}`;
        }

        console.log(`Logger::_createLogger:   * Transports to: ${transStr}`);


        return logger;
    }

    /**
     * Return the Logger Instance
     * @return {WinstonLogger}
     */
    public static getLogger(): WinstonLogger {
        if (Logger._logger === null) {
            Logger._logger = Logger._createLogger();
        }

        return Logger._logger;
    }

}