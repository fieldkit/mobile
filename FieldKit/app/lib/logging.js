import _ from "lodash";
import moment from "moment";
import Promise from "bluebird";
import { knownFolders } from "tns-core-modules/file-system";
import Config from "../config";

const SaveInterval = 10000;
const logs = [];
const originalConsole = console;

function getPrettyTime() {
	return moment().format();
}

function getLogsFile() {
	return knownFolders.documents().getFolder("diagnostics").getFile("logs.txt");
}

function flush() {
	const appending = _(logs).
		  map(log => {
			  return _(log).join(" ") + "\n";
		  }).
		  join("");

	logs.length = 0; // Empty logs.

	return new Promise((resolve, reject) => {
		const file = getLogsFile();
		const existing = file.readTextSync() || "";
		const replacing = existing + appending + "\n";

		file.writeTextSync(replacing, (err) => {
			if (err) {
				reject(err)
			}
		});

		resolve()
	});
}

export function copyLogs(where) {
	return new Promise((resolve, reject) => {
		const file = getLogsFile();
		const existing = file.readTextSync();

		where.writeTextSync(existing, (err) => {
			if (err) {
				reject(err)
			}
		});

		originalConsole.info("copied", existing.length, where.path)

		resolve()
	});
}

export function initializeLogging(info) {
    // NOTE: http://tobyho.com/2012/07/27/taking-over-console-log/
    if (TNS_ENV === "test") {
        return;
    }

    if (Config.logging.SaveLogs === false) {
        return;
    }

    console.log("saving logs");

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

    setInterval(flush, SaveInterval);

	return Promise.resolve();
}
