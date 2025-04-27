/**
 * String Helper
 */
export class StringHelper {

    /**
     * A sprintf helper for string formating
     * @param {string} format
     * @param {any[]} args
     */
    public static sprintf(format: string, ...args: any[]): string {
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
                    } catch {
                        return "[Circular]";
                    }

                case "%e":
                    if (arg instanceof Error) {
                        return `${arg.name}: ${arg.message}`;
                    } else {
                        return String(arg);
                    }

                case "%t":
                    if (arg instanceof Error) {
                        return arg.stack || `${arg.name}: ${arg.message}`;
                    } else {
                        return String(arg);
                    }

                default:
                    return match;
            }
        });
    }

}