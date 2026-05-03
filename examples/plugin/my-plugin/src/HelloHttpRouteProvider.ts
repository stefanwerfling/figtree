import {ProviderEntry} from 'figtree-schemas';
import {HttpRouteLoaderType, HttpRouteProviderType, IHttpRouteProvider} from 'figtree';
import {HelloRouteLoader} from './HelloRouteLoader.js';

const PROVIDER_NAME = 'my-plugin';
const PROVIDER_TITLE = 'Demo Plugin Routes';

/**
 * The actual provider — `BaseProviders<...>` queries this via `getProviders()`
 * to obtain the route loader.
 */
export class HelloHttpRouteProvider implements IHttpRouteProvider {

    public getName(): string {
        return PROVIDER_NAME;
    }

    public getTitle(): string {
        return PROVIDER_TITLE;
    }

    public getType(): string {
        return HttpRouteProviderType;
    }

    public getProviderEntry(): ProviderEntry {
        return {
            name: this.getName(),
            title: this.getTitle()
        };
    }

    public getRouteLoader(): HttpRouteLoaderType {
        return HelloRouteLoader;
    }

}