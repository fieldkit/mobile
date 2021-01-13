import { analytics } from "@nativescript/firebase/analytics";
import { Services } from "@/services";
import { promiseAfter } from "@/utilities";
import { ActionTypes, OurStore } from "@/store";
import registerLifecycleEvents from "@/services/lifecycle";
import { deleteMissingAssets } from "@/services";

// import { ProcessAllStationsTask } from "@/lib/process";

function updateStore(store: OurStore): Promise<void> {
    void promiseAfter(1000)
        .then(() => store.dispatch(ActionTypes.REFRESH))
        .catch((error) => {
            console.log(`refresh:error: ${JSON.stringify(error)}`);
        })
        .finally(() => void updateStore(store));
    return Promise.resolve();
}

function enableLocationServices(services: Services): Promise<void> {
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
    console.log(`startup-portal: begin`);

    await services.StationFirmware().cleanupFirmware();
    await resumePortalSession(services);
    await services.PortalUpdater().start();

    console.log(`startup-portal: end`);
}

async function startupStore(services: Services): Promise<void> {
    console.log(`startup-store: begin`);

    await services.DiscoverStation().startMonitorinNetwork();
    await updateStore(services.Store());
    // await services.Tasks().enqueue(new ProcessAllStationsTask()));
    await enableLocationServices(services);

    console.log(`startup-store: end`);
}

async function background(services: Services): Promise<void> {
    console.log(`startup:bg begin`);

    await Promise.all([startupPortal(services), startupStore(services)]);

    if (false) {
        registerLifecycleEvents(() => services.DiscoverStation());
    }

    console.log(`startup:bg end`);
}

export async function initializeApplication(services: Services): Promise<void> {
    const started = new Date();

    try {
        await analytics.logEvent({ key: "app_open" });
    } catch (error) {
        console.log(`firebase:error: ${JSON.stringify(error)}`);
    }

    try {
        await services.CreateDb().initialize(null, false, false);
        await services.Database().startup();
        await deleteMissingAssets(services.Database());
        await services.Store().dispatch(ActionTypes.LOAD);

        console.log("startup:bg");

        void background(services);

        const now = new Date();
        const elapsed = now.getTime() - started.getTime();
        console.log("startup:started", elapsed);
    } catch (error) {
        console.log(`startup:error: ${JSON.stringify(error)}`);
    }
}
