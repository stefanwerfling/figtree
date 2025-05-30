import path from 'path';
import {Logger} from '../../Logger/Logger.js';
import {PluginManager, PluginManagerOptions} from '../../Plugins/PluginManager.js';
import {ServiceAbstract, ServiceImportance, ServiceStatus} from '../../Service/ServiceAbstract.js';
import {StringHelper} from '../../Utils/StringHelper.js';

/**
 * Plugin Service
 */
export class PluginService extends ServiceAbstract {

    /**
     * Name of the services
     */
    public static NAME = 'plugin';

    /**
     * Importance
     */
    protected readonly _importance: ServiceImportance = ServiceImportance.Critical;

    /**
     * PluginManager
     * @protected
     */
    protected _pluginManager: PluginManager;

    /**
     * Constructor
     * @param {string} appName
     * @param {[string]} serviceName
     * @param {[string[]]} serviceDependencies
     * @param {PluginManagerOptions} options
     */
    public constructor(appName: string, serviceName?: string, serviceDependencies?: string[], options: PluginManagerOptions = {}) {
        super(serviceName ?? PluginService.NAME, serviceDependencies);

        if (options.appPath === undefined) {
            options.appPath = path.resolve()
        }

        this._pluginManager = new PluginManager(appName, options);
    }

    /**
     * Return the PluginManager instance
     * @return {PluginManager}
     */
    public getPluginManager(): PluginManager {
        return this._pluginManager;
    }

    /**
     * Start the service
     */
    public override async start(): Promise<void> {
        this._inProcess = true;
        this._status = ServiceStatus.Progress;

        try {
            await this._pluginManager.start();
        } catch(error) {
            this._status = ServiceStatus.Error;
            this._inProcess = false;

            this._statusMsg = StringHelper.sprintf(
                'PluginService::start: Error while create the PluginManager: %e',
                error
            );

            Logger.getLogger().error(this._statusMsg);

            throw error;
        }

        this._statusMsg = '';
        this._status = ServiceStatus.Success;
        this._inProcess = false;
    }

    /**
     * Stop the service
     * @param {boolean} forced
     */
    public override async stop(forced: boolean = false): Promise<void> {
        try {
            await this._pluginManager.stop();
        } catch (error) {
            this._status = ServiceStatus.Error;
            this._statusMsg = StringHelper.sprintf('PluginService::stop: Error stopping the PluginManager: %e', error);

            Logger.getLogger().error(this._statusMsg);
        } finally {
            this._status = ServiceStatus.None;
            this._inProcess = false;
        }
    }
}