import { Observable } from "tns-core-modules/data/observable";
import AppSettings from "../wrappers/app-settings";
import Services from "../services/services";
import routes from "../routes";

function getFirstRoute() {
    const appSettings = new AppSettings();

    if (Services.PortalInterface().isLoggedIn()) {
        return appSettings.getString("completedSetup") || appSettings.getNumber("skipCount") > 2 ? routes.stations : routes.assembleStation;
    }

    return routes.login;
}

export default {
    template: `<Frame ref="mainFrame" @navigated="navigated"></Frame>`,
    mounted() {
        console.log(`wrapper mounted`);
        const frame = this.$refs.mainFrame.nativeView;
        this.$navigateTo(getFirstRoute(), {
            frame: this.$refs.mainFrame,
        });
        console.log("ready");
    },
    unmounted() {
        console.log(`wrapped unmounted`);
    },
    errorCaptured(err, vm, info) {
        console.log(`error: ${err.toString()} info: ${info}`);
        return false;
    },
    methods: {
        navigated(entry) {
            console.log("nav");
        },
    },
};
