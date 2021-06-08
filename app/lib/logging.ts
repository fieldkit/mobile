import _ from "lodash";
import Vue from "vue";
import Bluebird from "bluebird";
import { Trace, knownFolders } from "@nativescript/core";
import { firebase } from "@nativescript/firebase";
import { crashlytics } from "@nativescript/firebase/crashlytics";
import { analytics } from "@nativescript/firebase/analytics";
import { AuthenticationError, QueryThrottledError } from "./errors";
import { File } from "./fs";
import { getTaskId } from "@/lib/zoning";
import { debug, TaskIdProvider, getMessageType, scrubMessage, DebugConsoleWriter } from "./debugging";

const MaximumLogFileSize = 1024 * 1024 * 1;

class FileWriter {
    private queued = "";
    private scheduled: unknown | null = null;

    constructor(public readonly getTaskId: TaskIdProvider) {}

    public write(message: string, category: string, type) {
        const date = new Date().toISOString();
        const messageType = getMessageType(type);
        const taskId = this.getTaskId();
        const scrubbed = scrubMessage(message);

        this.queued += `${date} ${messageType} ${taskId} ${category} ${scrubbed}\n`;

        if (!this.scheduled) {
            this.scheduled = setTimeout(() => {
                void this.flush().then(() => {
                    this.scheduled = null;
                });
            }, 1000);
        }
    }

    trimmed(possiblyLong: string): string {
        if (possiblyLong.length > MaximumLogFileSize) {
            const minimum = possiblyLong.length - MaximumLogFileSize;
            let trimmingAt = 0;
            while (trimmingAt < minimum) {
                trimmingAt = possiblyLong.indexOf("\n", trimmingAt + 1);
                if (trimmingAt == -1) {
                    return possiblyLong;
                }
            }
            console.log(`flush-trimmed:`, trimmingAt);
            return possiblyLong.slice(trimmingAt);
        }
        return possiblyLong;
    }

    async flush(): Promise<void> {
        try {
            const file = getLogsFile();
            const existing = await file.readText();
            const final = this.trimmed(existing + this.queued);
            await file.writeText(final);
            this.queued = "";

            console.log(`flushed ${final.length}`);
        } catch (error) {
            console.log(`flush-error`, error);
        }
    }
}

const logFileWriter = new FileWriter(getTaskId);

function getLogsFile(): File {
    return knownFolders.documents().getFolder("diagnostics").getFile("logs.txt");
}

async function flush(): Promise<void> {
    return await logFileWriter.flush();
}

export async function truncateLogs(): Promise<void> {
    await getLogsFile().remove();
}

export async function copyLogs(where: File): Promise<void> {
    return await flush().then(() => {
        return new Promise((resolve, reject) => {
            const file = getLogsFile();
            const existing = file.readTextSync();

            where.writeTextSync(existing, (err) => {
                if (err) {
                    reject(err);
                }
            });

            resolve();
        });
    });
}

function configureGlobalErrorHandling(): Promise<void> {
    try {
        Trace.setErrorHandler({
            handlerError(err) {
                void analytics.logEvent({
                    key: "app_error",
                });
                debug.log("error", err, err ? err.stack : null);
            },
        });

        Bluebird.onPossiblyUnhandledRejection((reason: Error, _promise: Promise<unknown>) => {
            if (reason instanceof AuthenticationError) {
                debug.log("onPossiblyUnhandledRejection", reason);
            } else if (reason instanceof QueryThrottledError) {
                debug.log("onPossiblyUnhandledRejection", reason);
            } else {
                if (/Animation cancelled/.test(reason.message)) {
                    debug.log("onPossiblyUnhandledRejection", reason);
                } else {
                    debug.log("onPossiblyUnhandledRejection", reason, reason ? reason.stack : null);
                }
            }
        });

        Vue.config.warnHandler = (msg: string, _vm, _info) => {
            debug.log("vuejs warning:", msg);
        };
    } catch (error) {
        if (error instanceof Error) {
            debug.log("startup error", error, error ? error.stack : null);
        } else {
            debug.log("startup error", error);
        }
    }

    return Promise.resolve();
}

async function initializeFirebase(): Promise<void> {
    debug.log("initialize:firebase");
    await firebase
        .init({
            crashlyticsCollectionEnabled: true,
        })
        .then((response) => {
            // eslint-disable-next-line
            const globalAny: any = global;
            // eslint-disable-next-line
            crashlytics.setString("env", globalAny.TNS_ENV);
            debug.log("firebase:initialized", response);
            return Promise.resolve(true);
        })
        .catch((error) => {
            debug.log("firebase:error", error);
            return Promise.resolve();
        });
}

async function initialize(): Promise<void> {
    // NOTE: http://tobyho.com/2012/07/27/taking-over-debug.log/
    const globalAny: any = global; // eslint-disable-line
    // eslint-disable-next-line
    if (globalAny.TNS_ENV === "test") {
        return;
    }

    Trace.enable();
    Trace.setCategories(Trace.categories.All);
    Trace.clearWriters();
    Trace.addWriter(new DebugConsoleWriter(getTaskId));
    Trace.addWriter(logFileWriter);

    await initializeFirebase();

    await configureGlobalErrorHandling();

    return;
}

export function initializeLogging(): Promise<void> {
    return initialize();
}
