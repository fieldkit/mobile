import { analytics } from "@nativescript/firebase/analytics";
import { Services } from "@/services";
import { promiseAfter } from "@/utilities";
import { ActionTypes, OurStore } from "@/store";
import registerLifecycleEvents from "@/services/lifecycle";
// import { ProcessAllStationsTask } from "@/lib/process";

function restartDiscovery(discoverStation): null {
    if (false) {
        promiseAfter(1000 * 30)
            .then(() => discoverStation.restart())
            .catch((err) => {
                console.log("refresh error", err, err ? err.stack : null);
            })
            .finally(() => restartDiscovery(discoverStation));
    }
    return null;
}

function updateStore(store: OurStore): Promise<void> {
    promiseAfter(1000)
        .then(() => store.dispatch(ActionTypes.REFRESH))
        .catch((err) => {
            console.log("refresh error", err, err ? err.stack : null);
        })
        .finally(() => updateStore(store));

    return Promise.resolve();
}

function enableLocationServices(services: Services): Promise<void> {
    // On iOS this can take a while, so we do this in the background.
    services.PhoneLocation().enableAndGetLocation();
    return Promise.resolve();
}

async function resumeSession(services: Services): Promise<void> {
    await services
        .StationFirmware()
        .cleanupFirmware()
        .then(async () => {
            const store = services.Store();
            if (store.state.portal.currentUser) {
                await store.dispatch(ActionTypes.AUTHENTICATED);
            }
        });
}

export async function initializeApplication(services: Services): Promise<void> {
    const started = new Date();

    try {
        await analytics.logEvent({ key: "app_open" });
    } catch (error) {
        console.log("firebase:error:", error, error ? error.stack : null);
    }

    try {
        await services.CreateDb().initialize(null, false, false);
        await services.Database().checkSettings();
        await services.Database().cleanup();
        await services.Store().dispatch(ActionTypes.INITIALIZE);

        console.log("services:ready");

        await services.Store().dispatch(ActionTypes.LOAD);
        await services.DiscoverStation().startMonitorinNetwork();
        await enableLocationServices(services);
        await services.PortalUpdater().start();
        await registerLifecycleEvents(() => services.DiscoverStation());
        await updateStore(services.Store());
        await resumeSession(services);
        await restartDiscovery(services.DiscoverStation());

        // await services.Tasks().enqueue(new ProcessAllStationsTask()))

        const now = new Date();
        const elapsed = now.getTime() - started.getTime();
        console.log("startup:started", elapsed);
    } catch (error) {
        console.log("startup:error:", error, error ? error.stack : null);
    }
}
