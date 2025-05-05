import { SchemaConfigDbOptions } from './ConfigDb.js';
import { SchemaConfigHttpServer } from './ConfigHttpServer.js';
import { SchemaConfigOptions } from './ConfigOptions.js';
export const SchemaConfigBackendOptions = SchemaConfigOptions.extend({
    db: SchemaConfigDbOptions,
    httpserver: SchemaConfigHttpServer
});
//# sourceMappingURL=ConfigBackendOptions.js.map