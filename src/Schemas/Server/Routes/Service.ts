import {ExtractSchemaResultType, Vts} from 'vts';
import {SchemaServiceInfoEntry} from '../../Service/ServiceInfoEntry.js';
import {SchemaDefaultReturn} from './DefaultReturn.js';

/**
 * Schema service status repsonse
 */
export const SchemaServiceStatusResponse = SchemaDefaultReturn.extend({
    services: Vts.array(SchemaServiceInfoEntry, {description: 'List of services'})
})

/**
 * Type of schema service status response
 */
export type ServiceStatusResponse = ExtractSchemaResultType<typeof SchemaServiceStatusResponse>;

/**
 * Schema service by name request
 */
export const SchemaServiceByNameRequest = Vts.object({
    name: Vts.string({description: 'Name of the service to be addressed'})
}, {description: 'Service by name request'});

/**
 * Type of schema service by name request
 */
export type ServiceByNameRequest = ExtractSchemaResultType<typeof SchemaServiceByNameRequest>;