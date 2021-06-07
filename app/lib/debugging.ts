import { isAndroid } from "@nativescript/core";
import Sqlite from "@/wrappers/sqlite";
import { Services } from "@/services";

export function downloadDatabase(services: Services, url: string): Promise<void> {
    const progress = (total: number, copied: number, _info: unknown) => {
        debug.log("progress", total, copied);
    };

    const folder = services.FileSystem().getFolder(isAndroid ? "app" : "");
    const name = "fieldkit.sqlite3";
    const destination = folder.getFile(name);

    return services
        .Conservify()
        .download({
            method: "GET",
            url: url,
            path: destination.path,
            progress: progress,
        })
        .catch((error) => {
            debug.log("error", error);
            return Promise.resolve();
        })
        .then((_response: unknown) => {
            new Sqlite().copy(name);
        });
}

export const debug = {
    log: function (...args: unknown[]): void {
        // eslint-disable-next-line
        console.log.apply(console, args);
    },
};
