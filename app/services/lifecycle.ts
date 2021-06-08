import {
    Application,
    LaunchEventData,
    ApplicationEventData,
    OrientationChangedEventData,
    UnhandledErrorEventData,
} from "@nativescript/core";
import DiscoverStation from "./discover-station";
import { debug, zoned } from "@/lib";
import { getBus } from "@/components/NavigationBus";

function wrap(fn: (args: unknown) => void): (args: unknown) => void {
    return async (args) => {
        await zoned({ force: true }, () => {
            fn(args);
            return Promise.resolve();
        });
    };
}

export default function (discoverStation: () => DiscoverStation): void {
    debug.log("lifecyle: registering");

    Application.on(
        Application.launchEvent,
        wrap((args: LaunchEventData) => {
            if (args.android) {
                debug.log("lifecycle: launched android:" /*, args.android*/);
            } else if (args.ios !== undefined) {
                debug.log("lifecycle: launched ios:" /*, args.ios*/);
            }

            return null;
        })
    );

    Application.on(
        Application.suspendEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                debug.log("lifecycle: suspend:");
            } else if (args.ios) {
                debug.log("lifecycle: suspend:");
            }

            if (discoverStation().started()) {
                debug.log("lifecycle: stopping discovery");
                void discoverStation().stopServiceDiscovery({ suspending: true });
            }

            return null;
        })
    );

    Application.on(
        Application.resumeEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                debug.log("lifecycle: resume:" /*, args.android*/);
            } else if (args.ios) {
                debug.log("lifecycle: resume:" /*, args.ios*/);
            }

            if (!discoverStation().started()) {
                debug.log("lifecycle: starting discovery");
                void discoverStation().startServiceDiscovery();
            }

            return null;
        })
    );

    Application.on(
        Application.displayedEvent,
        wrap((_args: ApplicationEventData) => {
            debug.log("lifecycle: displayedEvent");
        })
    );

    Application.on(
        Application.orientationChangedEvent,
        wrap((args: OrientationChangedEventData) => {
            debug.log("lifecycle: orientationChangedEvent", args.newValue);
            getBus().$emit("orientation:change", args.newValue);
        })
    );

    Application.on(
        Application.exitEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                // eslint-disable-next-line
                if (args.android.isFinishing()) {
                    debug.log("lifecycle: exit:" /*, args.android*/);
                } else {
                    debug.log("lifecycle: exit:" /*, args.android*/);
                }
            } else if (args.ios) {
                debug.log("lifecycle: exit:" /*, args.ios*/);
            }
        })
    );

    Application.on(
        Application.lowMemoryEvent,
        wrap((args: ApplicationEventData) => {
            if (args.android) {
                debug.log("lifecycle: lowMemory:" /*, args.android*/);
            } else if (args.ios) {
                debug.log("lifecycle: lowMemory:" /*, args.ios*/);
            }
        })
    );

    Application.on(
        Application.uncaughtErrorEvent,
        wrap((args: UnhandledErrorEventData) => {
            debug.log("lifecycle: error:", args.error);
        })
    );

    Application.on(
        Application.discardedErrorEvent,
        wrap((args: ApplicationEventData) => {
            debug.log("lifecycle: discarded:", args);
        })
    );
}
