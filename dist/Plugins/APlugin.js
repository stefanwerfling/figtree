export class APlugin {
    _info;
    _pluginManager;
    constructor(info, pm) {
        this._info = info;
        this._pluginManager = pm;
    }
    getPluginManager() {
        return this._pluginManager;
    }
}
//# sourceMappingURL=APlugin.js.map