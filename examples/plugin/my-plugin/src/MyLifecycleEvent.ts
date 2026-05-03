import {Logger, OnBackendLifecycleEvent} from 'figtree';

/**
 * Lifecycle hook — fires after services start / before services stop.
 */
export class MyLifecycleEvent extends OnBackendLifecycleEvent {

    public getName(): string {
        return 'my-plugin-lifecycle';
    }

    public override async onStart(): Promise<void> {
        Logger.getLogger().info('[my-plugin] backend is up — plugin lifecycle onStart fired');
    }

    public override async onStop(): Promise<void> {
        Logger.getLogger().info('[my-plugin] backend is shutting down — plugin lifecycle onStop fired');
    }

}