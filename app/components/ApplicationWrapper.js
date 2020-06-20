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
    // template: `<Frame id="mainFrame"></Frame>`,
    props: {},
    data() {
        return {
            child: getFirstRoute(),
        };
    },
    mounted() {
        console.log(`wrapper mounted`);
        /*
        return this.$navigateTo(getFirstRoute(), {
            frame: "mainFrame",
        }).then(
            () => {
                console.log("AW: done");
            },
            err => {
                console.log("ERROR", err);
            }
        );
		*/
    },
    errorCaptured(err, vm, info) {
        console.log(`error: ${err.toString()} info: ${info}`);
        return false;
    },
    methods: {},
    render(h) {
        return h("Frame", [h(this.child)]);
    },
};
