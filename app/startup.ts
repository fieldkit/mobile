import { analytics } from "@nativescript/firebase/analytics";
import { Services } from "@/services";
import { ActionTypes, OurStore } from "@/store";
import registerLifecycleEvents from "@/services/lifecycle";
import { deleteMissingAssets } from "@/services";
import { debug, promiseAfter, zoned } from "@/lib";

export function startUpdatingStoreEverySecond(store: OurStore): void {
    promiseAfter(1000)
        .then(() =>
            zoned({ force: true }, async () => {
                await store.dispatch(ActionTypes.REFRESH);
            })
        )
        .catch((error) => {
            debug.log(`refresh:error: ${JSON.stringify(error)}`, error);
        })
        .finally(() => void startUpdatingStoreEverySecond(store));
}

async function background(services: Services): Promise<void> {
    debug.log(`startup:bg begin`);

    // NOTE Right now this doesn't really do anything of the sort.
    await deleteMissingAssets(services.Database());

    // Start background updates of the store. This timer drives many things.
    startUpdatingStoreEverySecond(services.Store());

    // Start checking the portal for updates.
    await services.PortalUpdater().start();

    // On iOS this can take a while, so we do this in the background.
    void services.PhoneLocation().enableAndGetLocation();

    debug.log(`startup:bg end`);
}

export async function initializeApplication(services: Services): Promise<void> {
    const started = new Date();

    try {
        await analytics.logEvent({ key: "app_open" });
    } catch (error) {
        debug.log(`firebase:error: ${JSON.stringify(error)}`);
    }

    try {
        // Initialize the database first.
        await services.CreateDb().initialize(null, false, false);
        await services.Database().startup();

        debug.log("startup:db-ready");

        // Start monitoring right away.
        await services.DiscoverStation().startMonitorinNetwork();

        // This means we can respond to app suspends, etc... this may get moved
        // to later so that it can respond to things from a known state?
        registerLifecycleEvents(() => services.DiscoverStation());

        // Synchronous load of initial store state.
        await services.Store().dispatch(ActionTypes.LOAD);

        debug.log("startup:sync-done");

        // Now handle the background tasks.
        void background(services);

        const now = new Date();
        const elapsed = now.getTime() - started.getTime();
        debug.log("startup:started", elapsed);
    } catch (error) {
        debug.log(`startup:error: ${JSON.stringify(error)}`);
    }
}
