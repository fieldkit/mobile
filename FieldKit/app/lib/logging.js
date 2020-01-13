import _ from "lodash";
import moment from "moment";
import Promise from "bluebird";
import protobuf from "protobufjs";
import { setText } from "nativescript-clipboard";
import Config from "../config";

const logs = [];

function flush() {
    // console.log('flush', logs.length);
}

// NOTE This won't work yet.
export function getLogsAsProtobufs() {
    const encoded = _(logs)
        .map(log => {
            return {
                log: {
                    time: 0,
                    uptime: 0,
                    level: 0,
                    facility: "App",
                    message: JSON.stringify(log)
                }
            };
        })
        .map(log => {
            return DataRecord.encodeDelimited(row, buffer).finish();
        })
        .value();

    logs.length = 0; // Empty logs.

    return encoded;
}

export function getLogsAsString() {
    const encoded = _(logs)
        .map(log => {
            return _(log).join(" ");
        })
        .join("\n");

    logs.length = 0; // Empty logs.

    return encoded;
}

let originalConsole;

export function sendLogs() {
    if (Config.logging.SaveLogs === false) {
        return;
    }

    const text = getLogsAsString();
    setText(text).then(() => {
        console.log("copied");
    });
}

function getPrettyTime() {
	return moment().format();
}

export function initializeLogging() {
    // NOTE: http://tobyho.com/2012/07/27/taking-over-console-log/
    if (TNS_ENV === "test") {
        return;
    }

    if (Config.logging.SaveLogs === false) {
        return;
    }

    console.log("saving logs");

    originalConsole = console;

    function wrap(method) {
        const original = console[method];
        console[method] = function() {
            try {
                const args = Array.prototype.slice.apply(arguments);
				const time = getPrettyTime();
                const parts = [ time ];
                for (let i = 0; i < args.length; i++) {
                    const arg = args[i];
                    if (typeof arg === "string") {
                        parts.push(arg.trim());
                    } else {
                        parts.push(JSON.stringify(arg));
                    }
                }
                logs.push(parts);
				args.unshift(time);
                if (original.apply) {
                    original.apply(console, args);
                } else {
                    original(args.join(" ")); // IE
                }
            } catch (e) {
                originalConsole.log(e);
            }
        };
    }

    const methods = ["log", "warn", "error"];
    for (let i = 0; i < methods.length; i++) {
        wrap(methods[i]);
    }

    setInterval(() => {
        flush();
    }, 1000);
}
