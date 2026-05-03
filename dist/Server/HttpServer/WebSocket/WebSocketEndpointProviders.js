import { BaseProviders } from '../../../Provider/BaseProviders.js';
import { WebSocketEndpointProviderType } from './WebSocketEndpointProviderType.js';
export class WebSocketEndpointProviders extends BaseProviders {
    constructor() {
        super(WebSocketEndpointProviderType);
    }
    async getProvidersEndpoints() {
        const providers = await this.getProviders();
        const lists = await Promise.all(providers.map((p) => p.getEndpointLoader().loadEndpoints()));
        return lists.flat();
    }
}
//# sourceMappingURL=WebSocketEndpointProviders.js.map