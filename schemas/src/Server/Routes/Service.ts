import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaDefaultReturn} from './DefaultReturn.js';
import {SchemaServiceInfoEntry} from '../../Service/ServiceInfoEntry.js';

/**
 * Schema of ServiceStatusResponse
 */
export const SchemaServiceStatusResponse = SchemaDefaultReturn.extend({
    services: Vts.array(SchemaServiceInfoEntry),
}, {
    description: '',
});

/**
 * Type of schema ServiceStatusResponse
 */
export type ServiceStatusResponse = ExtractSchemaResultType<typeof SchemaServiceStatusResponse>;

/**
 * Schema of ServiceByNameRequest
 * Service by name request
 */
export const SchemaServiceByNameRequest = Vts.object({
    name: Vts.string({description: 'Name of the service to be addressed'}),
}, {
    description: 'Service by name request',
});

/**
 * Type of schema ServiceByNameRequest
 */
export type ServiceByNameRequest = ExtractSchemaResultType<typeof SchemaServiceByNameRequest>;