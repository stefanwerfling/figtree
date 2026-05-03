import {Router} from 'express';
import {StatusCodes} from 'figtree-schemas';
import {DefaultRoute} from 'figtree';
import {ExtractSchemaResultType, Vts} from 'vts';

const SchemaHelloResponse = Vts.object({
    statusCode: Vts.or([Vts.string(), Vts.number()]),
    msg: Vts.optional(Vts.string()),
    plugin: Vts.string(),
    pid: Vts.number()
});

type HelloResponse = ExtractSchemaResultType<typeof SchemaHelloResponse>;

/**
 * Demo route contributed by the plugin. Reachable at:
 *   GET /json/v1/plugin/hello
 */
export class HelloRoute extends DefaultRoute {

    public getExpressRouter(): Router {
        this._get(
            this._getUrl('v1', 'plugin', 'hello'),
            false,
            async(): Promise<HelloResponse> => {
                return {
                    statusCode: StatusCodes.OK,
                    plugin: 'my-plugin',
                    pid: process.pid
                };
            },
            {
                description: 'Hello from the plugin',
                tags: ['plugin'],
                responseBodySchema: SchemaHelloResponse
            }
        );

        return super.getExpressRouter();
    }

}