import { Vts } from 'vts';
import { SchemaDefaultReturn } from './DefaultReturn.js';
import { SchemaServiceInfoEntry } from '../../Service/ServiceInfoEntry.js';
export const SchemaServiceStatusResponse = SchemaDefaultReturn.extend({
    services: Vts.array(SchemaServiceInfoEntry),
}, {
    description: '',
});
export const SchemaServiceByNameRequest = Vts.object({
    name: Vts.string({ description: 'Name of the service to be addressed' }),
}, {
    description: 'Service by name request',
});
//# sourceMappingURL=Service.js.map