import {ExtractSchemaResultType} from 'vts';
import {SchemaConfigDbOptions} from './ConfigDb.js';
import {SchemaConfigHttpServer} from './ConfigHttpServer.js';
import {SchemaConfigOptions} from './ConfigOptions.js';

/**
 * Schema config backend options
 */
export const SchemaConfigBackendOptions = SchemaConfigOptions.extend({
    db: SchemaConfigDbOptions,
    httpserver: SchemaConfigHttpServer
});

/**
 * Type of config backend options
 */
export type ConfigBackendOptions = ExtractSchemaResultType<typeof SchemaConfigBackendOptions>;