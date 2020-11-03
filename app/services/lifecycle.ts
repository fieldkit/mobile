import {
    Application,
    LaunchEventData,
    ApplicationEventData,
    OrientationChangedEventData,
    UnhandledErrorEventData,
} from "@nativescript/core";
import DiscoverStation from "./discover-station";

export default function (discoverStation: () => DiscoverStation): void {
    Application.on(Application.launchEvent, (args: LaunchEventData) => {
        if (args.android) {
            console.log("lifecycle: launched android:", args.android);
        } else if (args.ios !== undefined) {
            console.log("lifecycle: launched ios:", args.ios);
        }

        return null;
    });

    Application.on(Application.suspendEvent, (args: ApplicationEventData) => {
        if (args.android) {
            console.log("lifecycle: suspend:", args.android);
        } else if (args.ios) {
            console.log("lifecycle: suspend:", args.ios);
        }

        if (discoverStation().started()) {
            console.log("lifecycle: stopping discovery");
            void discoverStation().stopServiceDiscovery();
        }

        return null;
    });

    Application.on(Application.resumeEvent, (args: ApplicationEventData) => {
        if (args.android) {
            console.log("lifecycle: resume:", args.android);
        } else if (args.ios) {
            console.log("lifecycle: resume:", args.ios);
        }

        if (!discoverStation().started()) {
            console.log("lifecycle: starting discovery");
            void discoverStation().startServiceDiscovery();
        }

        return null;
    });

    Application.on(Application.displayedEvent, (/*args: ApplicationEventData*/) => {
        console.log("lifecycle: displayedEvent");
    });

    Application.on(Application.orientationChangedEvent, (args: OrientationChangedEventData) => {
        console.log("lifecycle: orientationChangedEvent", args.newValue);
    });

    Application.on(Application.exitEvent, (args: ApplicationEventData) => {
        if (args.android) {
            // eslint-disable-next-line
            if (args.android.isFinishing()) {
                console.log("lifecycle: exit:", args.android);
            } else {
                console.log("lifecycle: exit:", args.android);
            }
        } else if (args.ios) {
            console.log("lifecycle: exit:", args.ios);
        }
    });

    Application.on(Application.lowMemoryEvent, (args: ApplicationEventData) => {
        if (args.android) {
            console.log("lifecycle: lowMemory:", args.android);
        } else if (args.ios) {
            console.log("lifecycle: lowMemory:", args.ios);
        }
    });

    Application.on(Application.uncaughtErrorEvent, (args: UnhandledErrorEventData) => {
        console.log("lifecycle: error:", args.error);
    });

    Application.on(Application.discardedErrorEvent, (args: ApplicationEventData) => {
        console.log("lifecycle: discarded:", args);
    });
}
