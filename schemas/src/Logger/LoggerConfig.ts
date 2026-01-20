import {ExtractSchemaResultType, Vts} from 'vts';

/**
 * Schema of LoggerConfig
 */
export const SchemaLoggerConfig = Vts.object({
    dirname: Vts.optional(Vts.string()),
    filename: Vts.optional(Vts.string()),
    zippedArchive: Vts.optional(Vts.boolean()),
    maxSize: Vts.optional(Vts.string()),
    maxFiles: Vts.optional(Vts.string()),
    enableConsole: Vts.optional(Vts.boolean()),
    level: Vts.optional(Vts.string()),
}, {
    description: '',
});

/**
 * Type of schema LoggerConfig
 */
export type LoggerConfig = ExtractSchemaResultType<typeof SchemaLoggerConfig>;