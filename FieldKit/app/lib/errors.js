import Bluebird from "bluebird";
import * as traceModule from "tns-core-modules/trace";
import Vue from "nativescript-vue";

export default function configureGlobalErrorHandling() {
    try {
        traceModule.setErrorHandler({
            handleError(err) {
                console.log("ERROR:");
                console.log(err);
                console.log(err.stack);
            },
        });

        traceModule.enable();

        Bluebird.onUnhandledRejectionHandled(error => {
            console.log("onUnhandledRejectionHandled", error);
            // throw error;
        });

        Bluebird.onPossiblyUnhandledRejection(error => {
            console.log("onPossiblyUnhandledRejection", error);
            // throw error;
        });

        // err: error trace
        // vm: component in which error occured
        // info: Vue specific error information such as lifecycle hooks, events etc.

        Vue.config.errorHandler = (err, vm, info) => {
            console.log("vuejs error:", err);
        };

        Vue.config.warnHandler = (msg, vm, info) => {
            console.log("vuejs warning:", msg);
        };
    } catch (e) {
        console.log("startup error", e, e.stack);
    }
}
