import {APluginEvent} from './APluginEvent.js';

/**
 * Plugin event for the BackendApp lifecycle.
 *
 * - `onStart()` fires AFTER all services have started — plugins can safely
 *   reach for any registered service or shared store.
 * - `onStop()` fires BEFORE the service shutdown loop runs, giving plugins
 *   a chance to flush state while the backend is still fully operational.
 *
 * Override one or both methods. The default no-op implementations let plugins
 * subscribe to only the half they care about.
 *
 * Plugins register an instance via `PluginManager.registerEvents(...)` from
 * their `onEnable()` hook.
 */
export abstract class OnBackendLifecycleEvent extends APluginEvent {

    /**
     * Fired after `ServiceManager.startAll()` has completed and the
     * `ClusterRegistry` heartbeat has been started (when in cluster mode).
     */
    public async onStart(): Promise<void> {
        // override in subclass
    }

    /**
     * Fired during graceful shutdown, before `ServiceManager.stopAll()`
     * runs. The backend is still fully operational at this point.
     */
    public async onStop(): Promise<void> {
        // override in subclass
    }

}