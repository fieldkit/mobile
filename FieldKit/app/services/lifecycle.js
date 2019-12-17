import { on, launchEvent, suspendEvent, resumeEvent, displayedEvent, orientationChangedEvent, exitEvent, lowMemoryEvent, uncaughtErrorEvent } from "tns-core-modules/application";

import Services from "./services";

export default function() {
    on(launchEvent, (args) => {
        if (args.android) {
            // For Android applications, args.android is an android.content.Intent class.
            console.log("Launched Android application with the following intent: " + args.android + ".");
        } else if (args.ios !== undefined) {
            // For iOS applications, args.ios is NSDictionary (launchOptions).
            console.log("Launched iOS application with options: " + args.ios);
        }
    });

    on(suspendEvent, (args) => {
        if (args.android) {
            // For Android applications, args.android is an android activity class.
			Services.DiscoverStation().stopServiceDiscovery();
            console.log("Suspend Activity: " + args.android);
        } else if (args.ios) {
            // For iOS applications, args.ios is UIApplication.
            Services.DiscoverStation().stopServiceDiscovery();
            console.log("Suspend UIApplication: " + args.ios);
        }
    });

    on(resumeEvent, (args) => {
        if (args.android) {
            // For Android applications, args.android is an android activity class.
            console.log("Resume Activity: " + args.android);
            Services.DiscoverStation().startServiceDiscovery();
        } else if (args.ios) {
            // For iOS applications, args.ios is UIApplication.
            console.log("Resume UIApplication: " + args.ios);
            Services.DiscoverStation().startServiceDiscovery();
        }
    });

    on(displayedEvent, (args) => {
        // args is of type ApplicationEventData
        console.log("DisplayedEvent");
    });

    on(orientationChangedEvent, (args) => {
        // args is of type OrientationChangedEventData
        console.log('orientationChangedEvent', args.newValue);
    });


    on(exitEvent, (args) => {
        if (args.android) {
            // For Android applications, args.android is an android activity class.
            console.log("Exit Activity: " + args.android);
            if (args.android.isFinishing()) {
                console.log("Exit Activity: " + args.android + " is exiting");
            } else {
                console.log("Exit Activity: " + args.android + " is restarting");
            }
        } else if (args.ios) {
            // For iOS applications, args.ios is UIApplication.
            console.log("Exit UIApplication: " + args.ios);
        }
    });

    on(lowMemoryEvent, (args) => {
        if (args.android) {
            // For Android applications, args.android is an android activity class.
            console.log("LowMemory Activity: " + args.android);
        } else if (args.ios) {
            // For iOS applications, args.ios is UIApplication.
            console.log("LowMemory UIApplication: " + args.ios);
        }
    });

    on(uncaughtErrorEvent, (args) => {
        console.log("Uncaught Error: " + args.error);
    });
}
