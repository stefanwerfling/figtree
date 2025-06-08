import { IProviders } from '../../Provider/IProviders.js';
import { ProviderEntry } from '../../Schemas/Provider/ProviderEntry.js';
import { IHttpRouteProvider } from './IHttpRouteProvider.js';
export type IHttpRouteProviders = IProviders<ProviderEntry, IHttpRouteProvider>;
