import { Vts } from 'vts';
import { StatusCodes } from './StatusCodes.js';
export const SchemaDefaultReturn = Vts.object({
    statusCode: Vts.or([Vts.string(), Vts.enum(StatusCodes)]),
    msg: Vts.optional(Vts.string({ description: 'Optional string message, is only set by a error code.' })),
}, {
    description: 'Default response from server.',
});
//# sourceMappingURL=DefaultReturn.js.map