import {
    Application,
    LaunchEventData,
    ApplicationEventData,
    OrientationChangedEventData,
    UnhandledErrorEventData,
} from "@nativescript/core";
import DiscoverStation from "./discover-station";
import { zoned } from "@/lib";

function wrap(fn: (args: unknown) => void): (args: unknown) => void {
    return async (args) => {
        await zoned(() => {
            fn(args);
            return Promise.resolve();
        });
    };
}

export default function (discoverStation: () => DiscoverStation): void {
    console.log("lifecyle: registering");

    Application.on(
        Application.launchEvent,
        wrap((args: LaunchEventData) => {
            if (args.android) {
                console.log("lifecycle: launched android:" /*, args.android*/);
            } else if (args.ios !== undefined) {
                console.log("lifecycle: launched ios:" /*, args.ios*/);
            }

            return null;
        })
    );

    Application.on(
        Application.suspendEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                console.log("lifecycle: suspend:");
            } else if (args.ios) {
                console.log("lifecycle: suspend:");
            }

            if (discoverStation().started()) {
                console.log("lifecycle: stopping discovery");
                void discoverStation().stopServiceDiscovery({ suspending: true });
            }

            return null;
        })
    );

    Application.on(
        Application.resumeEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                console.log("lifecycle: resume:" /*, args.android*/);
            } else if (args.ios) {
                console.log("lifecycle: resume:" /*, args.ios*/);
            }

            if (!discoverStation().started()) {
                console.log("lifecycle: starting discovery");
                void discoverStation().startServiceDiscovery();
            }

            return null;
        })
    );

    Application.on(
        Application.displayedEvent,
        wrap((_args: ApplicationEventData) => {
            console.log("lifecycle: displayedEvent");
        })
    );

    Application.on(
        Application.orientationChangedEvent,
        wrap((args: OrientationChangedEventData) => {
            console.log("lifecycle: orientationChangedEvent", args.newValue);
        })
    );

    Application.on(
        Application.exitEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                // eslint-disable-next-line
                if (args.android.isFinishing()) {
                    console.log("lifecycle: exit:" /*, args.android*/);
                } else {
                    console.log("lifecycle: exit:" /*, args.android*/);
                }
            } else if (args.ios) {
                console.log("lifecycle: exit:" /*, args.ios*/);
            }
        })
    );

    Application.on(
        Application.lowMemoryEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                console.log("lifecycle: lowMemory:" /*, args.android*/);
            } else if (args.ios) {
                console.log("lifecycle: lowMemory:" /*, args.ios*/);
            }
        })
    );

    Application.on(
        Application.uncaughtErrorEvent,
        wrap((args: UnhandledErrorEventData) => {
            console.log("lifecycle: error:", args.error);
        })
    );

    Application.on(
        Application.discardedErrorEvent,
        wrap((args: ApplicationEventData) => {
            console.log("lifecycle: discarded:", args);
        })
    );
}
