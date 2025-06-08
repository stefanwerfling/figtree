#!/usr/bin/env node
import { CreatePluginHash } from './CreatePluginHash.js';
const args = process.argv.slice(2);
if (args.length > 0) {
    switch (args[0]) {
        case '-create-plugin-hash':
            const cph = new CreatePluginHash();
            await cph.exec();
            break;
        default:
            console.log(`Unknown Cli-Arg "${args[0]}"`);
    }
}
else {
    console.log('Please use Cli-Args for execute!');
}
//# sourceMappingURL=index.js.map