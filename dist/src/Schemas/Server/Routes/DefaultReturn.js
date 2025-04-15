import { Vts } from 'vts';
import { StatusCodes } from './StatusCodes.js';
export const SchemaDefaultReturn = Vts.object({
    statusCode: Vts.or([Vts.enum(StatusCodes), Vts.number()]),
    msg: Vts.optional(Vts.string())
});
//# sourceMappingURL=DefaultReturn.js.map