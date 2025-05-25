import {PluginDefinition} from '../Schemas/Plugin/PluginDefinition.js';
import {PluginManager} from './PluginManager.js';

/**
 * Abstract Plugin class
 */
export abstract class APlugin {

    /**
     * plugin information by package.json
     * @protected
     */
    protected _info: PluginDefinition;

    /**
     * plugin manager
     * @private
     */
    private readonly _pluginManager: PluginManager;

    /**
     * constructor
     * @param {PluginDefinition} info
     * @param {PluginManager} pm
     */
    public constructor(info: PluginDefinition, pm: PluginManager) {
        this._info = info;
        this._pluginManager = pm;
    }

    /**
     * getPluginManager
     * @protected
     * @returns {PluginManager}
     */
    protected getPluginManager(): PluginManager {
        return this._pluginManager;
    }

    /**
     * plugin name
     * @returns {string}
     */
    public abstract getName(): string;

    /**
     * onEnable
     * @returns {boolean}
     */
    public abstract onEnable(): Promise<boolean>;

    /**
     * onDisable
     * @returns {boolean}
     */
    public abstract onDisable(): Promise<boolean>;

}