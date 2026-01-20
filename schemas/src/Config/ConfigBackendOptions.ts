import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaConfigOptions} from './ConfigOptions.js';
import {SchemaConfigDbOptions} from './ConfigDb.js';
import {SchemaConfigHttpServer} from './ConfigHttpServer.js';

/**
 * Schema of ConfigBackendOptions
 */
export const SchemaConfigBackendOptions = SchemaConfigOptions.extend({
    db: SchemaConfigDbOptions,
    httpserver: SchemaConfigHttpServer,
}, {
    description: '',
});

/**
 * Type of schema ConfigBackendOptions
 */
export type ConfigBackendOptions = ExtractSchemaResultType<typeof SchemaConfigBackendOptions>;