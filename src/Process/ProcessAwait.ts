import {ChildProcessWithoutNullStreams} from 'child_process';
import {Logger} from '../Logger/Logger.js';

/**
 * ProcessAwait
 */
export class ProcessAwait {

    /**
     * process
     * @param {ChildProcessWithoutNullStreams} process
     */
    public static async process(process: ChildProcessWithoutNullStreams): Promise<void> {
        process.stdout!.on('data', (buf) => {
            if (Logger.hasLogger()) {
                Logger.getLogger().info(buf.toString());
            }
        });

        process.stderr!.on('data', (buf) => {
            if (Logger.hasLogger()) {
                Logger.getLogger().error(buf.toString());
            }
        });

        await new Promise((resolve) => {
            process.on('close', resolve);
        });
    }

}