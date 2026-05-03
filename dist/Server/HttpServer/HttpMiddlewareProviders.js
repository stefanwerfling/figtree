import { BaseProviders } from '../../Provider/BaseProviders.js';
import { HttpMiddlewareProviderType } from './HttpMiddlewareProviderType.js';
export class HttpMiddlewareProviders extends BaseProviders {
    constructor() {
        super(HttpMiddlewareProviderType);
    }
    async getProvidersMiddleware() {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map(async (p) => {
            const mw = await p.getMiddleware();
            return Array.isArray(mw) ? mw : [mw];
        }));
        return lists.flat();
    }
}
//# sourceMappingURL=HttpMiddlewareProviders.js.map