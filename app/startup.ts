import { analytics } from "@nativescript/firebase/analytics";
import { Services } from "@/services";
import { ActionTypes, OurStore } from "@/store";
import registerLifecycleEvents from "@/services/lifecycle";
import { deleteMissingAssets } from "@/services";
import { debug, promiseAfter, zoned } from "@/lib";

export function updateStore(store: OurStore): Promise<void> {
    promiseAfter(1000)
        .then(() =>
            zoned({ force: true }, async () => {
                await store.dispatch(ActionTypes.REFRESH);
            })
        )
        .catch((error) => {
            debug.log(`refresh:error: ${JSON.stringify(error)}`, error);
        })
        .finally(() => void updateStore(store));
    return Promise.resolve();
}

export function enableLocationServices(services: Services): Promise<void> {
    // On iOS this can take a while, so we do this in the background.
    void services.PhoneLocation().enableAndGetLocation();
    return Promise.resolve();
}

async function resumePortalSession(services: Services): Promise<void> {
    const store = services.Store();
    if (store.state.portal.currentUser) {
        await store.dispatch(ActionTypes.AUTHENTICATED);
    }
}

async function startupPortal(services: Services): Promise<void> {
    debug.log(`startup-portal: begin`);

    await resumePortalSession(services);
    await services.PortalUpdater().start();

    debug.log(`startup-portal: end`);
}

async function startupStore(services: Services): Promise<void> {
    debug.log(`startup-store: begin`);

    await services.DiscoverStation().startMonitorinNetwork();
    await updateStore(services.Store());
    await enableLocationServices(services);

    debug.log(`startup-store: end`);
}

async function background(services: Services): Promise<void> {
    debug.log(`startup:bg begin`);

    registerLifecycleEvents(() => services.DiscoverStation());

    await Promise.all([startupPortal(services), startupStore(services)]);

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
        await services.CreateDb().initialize(null, false, false);
        await services.Database().startup();
        await deleteMissingAssets(services.Database());
        await services.Store().dispatch(ActionTypes.LOAD);

        debug.log("startup:bg");

        void background(services);

        const now = new Date();
        const elapsed = now.getTime() - started.getTime();
        debug.log("startup:started", elapsed);
    } catch (error) {
        debug.log(`startup:error: ${JSON.stringify(error)}`);
    }
}
