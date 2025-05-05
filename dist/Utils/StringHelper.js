export class StringHelper {
    static sprintf(format, ...args) {
        let i = 0;
        return format.replace(/%[sdfje]/g, (match) => {
            if (i >= args.length) {
                return match;
            }
            const arg = args[i++];
            switch (match) {
                case "%s":
                    return String(arg);
                case "%d":
                    return parseInt(arg, 10).toString();
                case "%f":
                    return parseFloat(arg).toString();
                case "%j":
                    try {
                        return JSON.stringify(arg);
                    }
                    catch {
                        return "[Circular]";
                    }
                case "%e":
                    if (arg instanceof Error) {
                        return `${arg.name}: ${arg.message}`;
                    }
                    else {
                        return String(arg);
                    }
                case "%t":
                    if (arg instanceof Error) {
                        return arg.stack || `${arg.name}: ${arg.message}`;
                    }
                    else {
                        return String(arg);
                    }
                default:
                    return match;
            }
        });
    }
}
//# sourceMappingURL=StringHelper.js.map