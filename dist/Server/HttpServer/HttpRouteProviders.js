import { BaseProviders } from '../../Provider/BaseProviders.js';
import { HttpRouteProviderType } from './HttpRouteProviderType.js';
export class HttpRouteProviders extends BaseProviders {
    constructor() {
        super(HttpRouteProviderType);
    }
    async getProvidersRoutes() {
        const providers = await this.getProviders();
        const routeLists = await Promise.all(providers.map((provider) => provider.getRouteLoader().loadRoutes()));
        return routeLists.flat();
    }
}
//# sourceMappingURL=HttpRouteProviders.js.map