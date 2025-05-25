import { PluginManager } from '../Plugins/PluginManager.js';
import { AProviderOnLoadEvent } from './AProviderOnLoadEvent.js';
export class BaseProviders {
    async _getProvider(name, type) {
        const events = PluginManager.getInstance().getAllEvents((AProviderOnLoadEvent));
        for await (const event of events) {
            const providers = await event.getProviders();
            for (const provider of providers) {
                if (provider.getType() === type && provider.getName() === name) {
                    return provider;
                }
            }
        }
        return null;
    }
    async _getProviders(type) {
        const list = [];
        const events = PluginManager.getInstance().getAllEvents((AProviderOnLoadEvent));
        for await (const event of events) {
            const providers = await event.getProviders();
            for (const provider of providers) {
                if (provider.getType() === type) {
                    list.push(provider.getProviderEntry());
                }
            }
        }
        return list;
    }
}
//# sourceMappingURL=BaseProviders.js.map