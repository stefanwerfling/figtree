import { Logger } from '../Logger/Logger.js';
export class ProcessAwait {
    static async process(process) {
        process.stdout.on('data', (buf) => {
            if (Logger.hasLogger()) {
                Logger.getLogger().info(buf.toString());
            }
        });
        process.stderr.on('data', (buf) => {
            if (Logger.hasLogger()) {
                Logger.getLogger().error(buf.toString());
            }
        });
        await new Promise((resolve) => {
            process.on('close', resolve);
        });
    }
}
//# sourceMappingURL=ProcessAwait.js.map