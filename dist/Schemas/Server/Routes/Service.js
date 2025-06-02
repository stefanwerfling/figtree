import { Vts } from 'vts';
import { SchemaServiceInfoEntry } from '../../Service/ServiceInfoEntry.js';
import { SchemaDefaultReturn } from './DefaultReturn.js';
export const SchemaServiceStatusResponse = SchemaDefaultReturn.extend({
    services: Vts.array(SchemaServiceInfoEntry, { description: 'List of services' })
});
//# sourceMappingURL=Service.js.map