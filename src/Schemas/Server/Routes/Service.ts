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