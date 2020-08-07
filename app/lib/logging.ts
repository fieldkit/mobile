import _ from "lodash";
import moment from "moment";
import Promise from "bluebird";
import { knownFolders } from "tns-core-modules/file-system";
import * as traceModule from "tns-core-modules/trace";
import Firebase from "nativescript-plugin-firebase";
import { crashlytics } from "nativescript-plugin-firebase";
import Vue from "nativescript-vue";
import { AuthenticationError } from "./errors";
import Config from "../config";

const SaveInterval = 10000;
const logs: string[][] = [];
const originalConsole = console;
const MaximumLogSize = 1024 * 1024 * 5;

function getPrettyTime() {
    return moment().format();
}

function getLogsFile() {
    return knownFolders.documents().getFolder("diagnostics").getFile("logs.txt");
}

function getExistingLogs(file) {
    if (file.size < MaximumLogSize) {
        return file.readTextSync() || "";
    }
    return "";
}

function flush() {
    const appending = _(logs)
        .map((log) => {
            return scrubMessage(_(log).join(" ")) + "\n";
        })
        .join("");

    logs.length = 0; // Empty logs.

    return new Promise((resolve, reject) => {
        const file = getLogsFile();
        const existing = getExistingLogs(file);
        const replacing = existing + appending + "\n";

        file.writeTextSync(replacing, (err) => {
            if (err) {
                reject(err);
            }
        });

        resolve();
    });
}

export function copyLogs(where) {
    return flush().then(() => {
        return new Promise((resolve, reject) => {
            const file = getLogsFile();
            const existing = file.readTextSync();

            where.writeTextSync(existing, (err) => {
                if (err) {
                    reject(err);
                }
            });

            originalConsole.info("copied", existing.length, where.path);

            resolve();
        });
    });
}

function scrubMessage(message: string): string {
    return message.replace(/Bearer [^\s"']+/, "");
}

function wrapLoggingMethod(method) {
    const original = console[method];
    console[method] = function () {
        try {
            const errors: Error[] = [];
            const args = Array.prototype.slice.apply(arguments);
            const time = getPrettyTime();

            // Prepend time to the unaltered arguments we were
            // given and just log those using the original, we do
            // this before the persisted logging cause that may
            // throw errors and this helps fix them.
            args.unshift(time);
            if (original.apply) {
                original.apply(console, args);
            } else {
                original(args.join(" ")); // IE
            }

            // This takes args and gets good string representations
            // for them, filling up the parts arary, beginning with
            // the time.
            const parts = [time];
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg instanceof Error) {
                    parts.push(arg.message);
                    if (arg.stack) parts.push(arg.stack);
                    errors.push(arg);
                } else if (typeof arg === "string") {
                    parts.push(arg.trim());
                } else {
                    try {
                        parts.push(JSON.stringify(arg));
                    } catch (e) {
                        originalConsole.log("[logging error]", e);
                    }
                }
            }

            // Append to our global logs array.
            logs.push(parts.slice());

            // Send string only representations to Crashlytics,
            // removing time since they do that for us.
            parts.shift();
            crashlytics.log(scrubMessage(parts.join(" ")));

            errors.forEach((error) => {
                // crashlytics.error(error);
            });
        } catch (e) {
            originalConsole.log(e);
        }
    };
}

function configureGlobalErrorHandling() {
    try {
        traceModule.setErrorHandler({
            handlerError(err) {
                Firebase.analytics.logEvent({
                    key: "app_error",
                });
                console.log("error", err, err ? err.stack : null);
            },
        });

        traceModule.enable();

        Promise.onPossiblyUnhandledRejection((reason, promise) => {
            if (reason instanceof AuthenticationError) {
                console.log("onPossiblyUnhandledRejection", reason);
            } else {
                console.log("onPossiblyUnhandledRejection", reason, reason ? reason.stack : null);
            }
        });

        Promise.onUnhandledRejectionHandled((promise) => {
            console.log("onUnhandledRejectionHandled");
        });

        // err: error trace
        // vm: component in which error occured
        // info: Vue specific error information such as lifecycle hooks, events etc.
        /*
        Vue.config.errorHandler = (err, vm, info) => {
            console.log("vuejs error:", err, err ? err.stack : null);
        };
		*/

        Vue.config.warnHandler = (msg, vm, info) => {
            console.log("vuejs warning:", msg);
        };
    } catch (e) {
        console.log("startup error", e, e ? e.stack : null);
    }

    return Promise.resolve();
}

export default function initializeLogging(info) {
    // NOTE: http://tobyho.com/2012/07/27/taking-over-console-log/
    const globalAny: any = global;
    if (globalAny.TNS_ENV === "test") {
        return;
    }

    if (Config.logging.SaveLogs === false) {
        return;
    }

    console.log("saving logs");

    const methods = ["log", "warn", "error"];
    for (let i = 0; i < methods.length; i++) {
        wrapLoggingMethod(methods[i]);
    }

    setInterval(flush, SaveInterval);

    configureGlobalErrorHandling();

    return Promise.resolve();
}
