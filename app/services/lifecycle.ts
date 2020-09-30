import { Application } from "@nativescript/core";
import DiscoverStation from "./discover-station";

export default function (discoverStation: () => DiscoverStation) {
    Application.on(Application.launchEvent, (args) => {
        if (args.android) {
            console.log("lifecycle: launched android: " + args.android + ".");
        } else if (args.ios !== undefined) {
            console.log("lifecycle: launched ios: " + args.ios);
        }

        return null;
    });

    Application.on(Application.suspendEvent, (args) => {
        if (args.android) {
            console.log("lifecycle: suspend: " + args.android);
        } else if (args.ios) {
            console.log("lifecycle: suspend: " + args.ios);
        }

        if (discoverStation().started()) {
            console.log("lifecycle: stopping discovery");
            discoverStation().stopServiceDiscovery();
        }

        return null;
    });

    Application.on(Application.resumeEvent, (args) => {
        if (args.android) {
            console.log("lifecycle: resume: " + args.android);
        } else if (args.ios) {
            console.log("lifecycle: resume: " + args.ios);
        }

        if (!discoverStation().started()) {
            console.log("lifecycle: starting discovery");
            discoverStation().startServiceDiscovery();
        }

        return null;
    });

    Application.on(Application.displayedEvent, (args) => {
        console.log("lifecycle: displayedEvent");
    });

    Application.on(Application.orientationChangedEvent, (args) => {
        console.log("lifecycle: orientationChangedEvent", args.newValue);
    });

    Application.on(Application.exitEvent, (args) => {
        if (args.android) {
            if (args.android.isFinishing()) {
                console.log("lifecycle: exit: " + args.android + " is exiting");
            } else {
                console.log("lifecycle: exit: " + args.android + " is restarting");
            }
        } else if (args.ios) {
            console.log("lifecycle: exit: " + args.ios);
        }
    });

    Application.on(Application.lowMemoryEvent, (args) => {
        if (args.android) {
            console.log("lifecycle: lowMemory: " + args.android);
        } else if (args.ios) {
            console.log("lifecycle: lowMemory: " + args.ios);
        }
    });

    Application.on(Application.uncaughtErrorEvent, (args) => {
        console.log("lifecycle: error: " + args.error);
    });

    Application.on(Application.discardedErrorEvent, (args) => {
        console.log("lifecycle: discarded: " + args);
    });
}
