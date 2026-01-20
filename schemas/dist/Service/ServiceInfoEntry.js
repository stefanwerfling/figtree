import { Vts } from 'vts';
export const SchemaServiceInfoEntry = Vts.object({
    type: Vts.number({ description: 'Type of service' }),
    name: Vts.string({ description: 'Name of service' }),
    status: Vts.string({ description: 'Status of service' }),
    statusMsg: Vts.string({ description: 'Last status message' }),
    importance: Vts.number({ description: 'Is the service importance' }),
    inProcess: Vts.boolean({ description: 'Is the service in process' }),
    dependencies: Vts.array(Vts.string({ description: 'A service dependencie' })),
}, {
    description: 'Service Entry information',
});
//# sourceMappingURL=ServiceInfoEntry.js.map