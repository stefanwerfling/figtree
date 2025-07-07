export class Args {
    static get(schema) {
        const args = {};
        const processArgs = process.argv.slice(2, process.argv.length);
        processArgs.forEach((arg) => {
            if (arg.slice(0, 2) === '--') {
                const longArg = arg.split('=');
                const longArgFlag = longArg[0].slice(2, longArg[0].length);
                args[longArgFlag] = longArg.length > 1 ? longArg[1] : true;
            }
            else if (arg[0] === '-') {
                const flags = arg.slice(1, arg.length).split('');
                flags.forEach((flag) => {
                    args[flag] = true;
                });
            }
        });
        const errors = [];
        if (!schema.validate(args, errors)) {
            console.log('Args::get: Config arguments error:');
            for (const error of errors) {
                console.log(`Args::get: - ${error}`);
            }
            process.exit(1);
        }
        return args;
    }
}
//# sourceMappingURL=Args.js.map