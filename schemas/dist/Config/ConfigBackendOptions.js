import { SchemaConfigOptions } from './ConfigOptions.js';
import { SchemaConfigDbOptions } from './ConfigDb.js';
import { SchemaConfigHttpServer } from './ConfigHttpServer.js';
export const SchemaConfigBackendOptions = SchemaConfigOptions.extend({
    db: SchemaConfigDbOptions,
    httpserver: SchemaConfigHttpServer,
}, {
    description: '',
});
//# sourceMappingURL=ConfigBackendOptions.js.map