import { BaseProviders } from '../../Provider/BaseProviders.js';
import { HttpRouteProviderType } from './HttpRouteProviderType.js';
export class HttpRouteProviders extends BaseProviders {
    constructor() {
        super(HttpRouteProviderType);
    }
    async getProvidersRoutes() {
        const list = [];
        const providers = await this.getProviders();
        for (const provider of providers) {
            const routeLoader = provider.getRouteLoader();
            list.push(...await routeLoader.loadRoutes());
        }
        return list;
    }
}
//# sourceMappingURL=HttpRouteProviders.js.map