import { PluginManager } from '../Plugins/PluginManager.js';
import { AProviderOnLoadEvent } from './AProviderOnLoadEvent.js';
export class BaseProviders {
    _providerType;
    constructor(providerType) {
        this._providerType = providerType;
    }
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
    async getProvider(name) {
        return this._getProvider(name, this._providerType);
    }
    async _getProviders(type) {
        const list = [];
        const events = PluginManager.getInstance().getAllEvents((AProviderOnLoadEvent));
        for await (const event of events) {
            const providers = await event.getProviders();
            for (const provider of providers) {
                if (provider.getType() === type) {
                    list.push(provider);
                }
            }
        }
        return list;
    }
    async getProviders() {
        return this._getProviders(this._providerType);
    }
    async _getProvidersEntries(type) {
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
    async getProvidersEntries() {
        return this._getProvidersEntries(this._providerType);
    }
}
//# sourceMappingURL=BaseProviders.js.map