import { APluginEvent } from './APluginEvent.js';
export declare abstract class OnBackendLifecycleEvent extends APluginEvent {
    onStart(): Promise<void>;
    onStop(): Promise<void>;
}
