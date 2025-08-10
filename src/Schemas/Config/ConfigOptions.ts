import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaLoggerConfig} from '../Logger/LoggerConfig.js';

/**
 * Schema of ConfigOptions
 */
export const SchemaConfigOptions = Vts.object({
    logging: Vts.optional(SchemaLoggerConfig),
}, {
    description: '',
});

/**
 * Type of schema ConfigOptions
 */
export type ConfigOptions = ExtractSchemaResultType<typeof SchemaConfigOptions>;