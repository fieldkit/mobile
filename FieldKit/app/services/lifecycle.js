import {
    on,
    launchEvent,
    suspendEvent,
    resumeEvent,
    displayedEvent,
    orientationChangedEvent,
    exitEvent,
    lowMemoryEvent,
    uncaughtErrorEvent,
} from "tns-core-modules/application";

import Services from "./services";

function onLaunchOrResume(services) {
    services
        .PortalInterface()
        .onlyIfAuthenticated()
        .then(() => {
            console.log("downloading firmware");
            return services
                .StationFirmware()
                .downloadFirmware()
                .then(() => {
                    console.log("launch prep done");
                });
        });
}

export default function() {
    const services = Services;

    on(launchEvent, args => {
        if (args.android) {
            console.log("Launched Android application with the following intent: " + args.android + ".");
        } else if (args.ios !== undefined) {
            console.log("Launched iOS application with options: " + args.ios);
        }

        onLaunchOrResume(services);
    });

    on(suspendEvent, args => {
        if (args.android) {
            console.log("Suspend Activity: " + args.android);
        } else if (args.ios) {
            console.log("Suspend UIApplication: " + args.ios);
        }

        services.DiscoverStation().stopServiceDiscovery();
    });

    on(resumeEvent, args => {
        if (args.android) {
            console.log("Resume Activity: " + args.android);
        } else if (args.ios) {
            console.log("Resume UIApplication: " + args.ios);
        }

        services.DiscoverStation().startServiceDiscovery();

        onLaunchOrResume(services);
    });

    on(displayedEvent, args => {
        console.log("DisplayedEvent");
    });

    on(orientationChangedEvent, args => {
        console.log("orientationChangedEvent", args.newValue);
    });

    on(exitEvent, args => {
        if (args.android) {
            if (args.android.isFinishing()) {
                console.log("Exit Activity: " + args.android + " is exiting");
            } else {
                console.log("Exit Activity: " + args.android + " is restarting");
            }
        } else if (args.ios) {
            console.log("Exit UIApplication: " + args.ios);
        }
    });

    on(lowMemoryEvent, args => {
        if (args.android) {
            console.log("LowMemory Activity: " + args.android);
        } else if (args.ios) {
            console.log("LowMemory UIApplication: " + args.ios);
        }
    });

    on(uncaughtErrorEvent, args => {
        console.log("Uncaught Error: " + args.error);
    });
}
