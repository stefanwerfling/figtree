import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Schema Logger config
 */
export const SchemaLoggerConfig = Vts.object({
    dirname: Vts.optional(Vts.string()),
    filename: Vts.optional(Vts.string()),
    zippedArchive: Vts.optional(Vts.boolean()),
    maxSize: Vts.optional(Vts.string()),
    maxFiles: Vts.optional(Vts.string()),
    enableConsole: Vts.optional(Vts.boolean()),
    level: Vts.optional(Vts.string())
});

/**
 * Type of Logger config
 */
export type LoggerConfig = ExtractSchemaResultType<typeof SchemaLoggerConfig>;