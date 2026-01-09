import path from 'path';
import { Logger } from '../../Logger/Logger.js';
import { PluginManager } from '../../Plugins/PluginManager.js';
import { ServiceAbstract, ServiceImportance, ServiceStatus } from '../../Service/ServiceAbstract.js';
import { StringHelper } from '../../Utils/StringHelper.js';
export class PluginService extends ServiceAbstract {
    static NAME = 'plugin';
    _importance = ServiceImportance.Critical;
    _pluginManager;
    constructor(appName, serviceName, serviceDependencies, options = {}) {
        super(serviceName ?? PluginService.NAME, serviceDependencies);
        if (options.appPath === undefined) {
            options.appPath = path.resolve();
        }
        this._pluginManager = new PluginManager(appName, options);
    }
    getPluginManager() {
        return this._pluginManager;
    }
    async start() {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;
        try {
            await this._pluginManager.start();
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;
            this._statusMsg = StringHelper.sprintf('PluginService::start: Error while create the PluginManager: %e', error);
            Logger.getLogger().error(this._statusMsg);
            throw error;
        }
        this._statusMsg = '';
        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }
    async stop() {
        try {
            await this._pluginManager.stop();
        }
        catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('PluginService::stop: Error stopping the PluginManager: %e', error);
            Logger.getLogger().error(this._statusMsg);
        }
        finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}
//# sourceMappingURL=PluginService.js.map