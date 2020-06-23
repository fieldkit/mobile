import { Observable } from "tns-core-modules/data/observable";
import { Route } from "../routes/navigate";
import StartupScreen from "./StartupScreen";
import Config from "../config";

export default {
    template: `<Frame ref="mainFrame" @navigated="navigated"></Frame>`,
    mounted() {
        console.log(`wrapper mounted`);
        const frame = this.$refs.mainFrame.nativeView;
        if (Config.env.dev) {
            frame.transition = { name: "fade", animated: false };
        }

        const route = new Route(StartupScreen, { startup: true });
        this.$navigateTo(route, {
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
            // console.log("nav");
        },
    },
};
