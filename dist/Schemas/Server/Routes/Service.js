import { Vts } from 'vts';
import { SchemaServiceInfoEntry } from '../../Service/ServiceInfoEntry.js';
import { SchemaDefaultReturn } from './DefaultReturn.js';
export const SchemaServiceStatusResponse = SchemaDefaultReturn.extend({
    services: Vts.array(SchemaServiceInfoEntry, { description: 'List of services' })
});
export const SchemaServiceByNameRequest = Vts.object({
    name: Vts.string({ description: 'Name of the service to be addressed' })
}, { description: 'Service by name request' });
//# sourceMappingURL=Service.js.map