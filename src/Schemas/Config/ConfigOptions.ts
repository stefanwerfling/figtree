import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaLoggerConfig} from '../Logger/LoggerConfig.js';

/**
 * Schema Config options
 */
export const SchemaConfigOptions = Vts.object({
    logging: Vts.optional(SchemaLoggerConfig)
});

/**
 * Type Config options
 */
export type ConfigOptions = ExtractSchemaResultType<typeof SchemaConfigOptions>;