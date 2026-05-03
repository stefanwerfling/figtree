import {ConfigOptions, DefaultArgs, SchemaDefaultArgs} from 'figtree-schemas';
import {Schema} from 'vts';
import {
    ACL,
    BackendApp,
    BackendCluster,
    ClusterLeader,
    HttpService,
    Logger,
    PluginService,
    SharedStore,
    setupClusterRegistryFromConfig
} from 'figtree';
import {MyACLRbac} from '../ACL/MyACLRbac.js';
import {ExampleConfig} from '../Config/ExampleConfig.js';
import {ExampleRouteLoader} from '../Routes/ExampleRouteLoader.js';
import {HelloCronJob} from '../Services/HelloCronJob.js';

export class ExampleBackend extends BackendApp<DefaultArgs, ConfigOptions> {

    public static NAME = 'example_cluster_backend';

    public constructor() {
        super(ExampleBackend.NAME);
    }

    protected override _getConfigInstance(): ExampleConfig {
        const config = ExampleConfig.getInstance();
        config.setAppName('example-cluster');

        return config;
    }

    protected override _getArgSchema(): Schema<DefaultArgs> | null {
        return SchemaDefaultArgs;
    }

    protected override async _initServices(): Promise<void> {
        // Auto-wires SharedStore + ClusterRegistry from `config.cluster.sharedStore`.
        // Returns null in single-process mode (config.cluster.enabled !== true).
        const cluster = await setupClusterRegistryFromConfig();

        ACL.getInstance().addController(new MyACLRbac());

        // Services every worker needs (DB pools, plugin loader, ...) — no role filter.
        this._serviceManager.add(new PluginService(ExampleBackend.NAME));

        // HTTP-only services — only registered on workers with WORKER_ROLE=http.
        this._serviceManager.add(new HttpService(ExampleRouteLoader), ['http']);

        // Cron-only services — only on workers with WORKER_ROLE=cron.
        this._serviceManager.add(new HelloCronJob(), ['cron']);

        // For multi-host setups: gate cron with a ClusterLeader so exactly one
        // host runs the job even if several cron workers exist across hosts.
        if (cluster && BackendCluster.getWorkerRole() === 'cron') {
            this._setupCronLeader(cluster.store);
        }
    }

    private async _setupCronLeader(store: SharedStore): Promise<void> {
        const leader = new ClusterLeader(store, { name: 'cron-master' });

        leader.onLeaderElected(() => {
            Logger.getLogger().info('this worker became cluster-wide cron leader');
        });

        leader.onLeaderLost(() => {
            Logger.getLogger().warn('this worker lost cluster-wide cron leadership');
        });

        await leader.start();
    }

}