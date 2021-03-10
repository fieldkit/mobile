import fs from "fs";
import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services, ServicesImpl } from "@/services";
import { Database } from "@/wrappers/sqlite";
import { ActionTypes, Station, StationSyncStatus, FileType, ResetSyncStatusAction } from "@/store";
import { deleteMissingAssets } from "@/services";
import { rebaseAbsolutePath } from "@/lib/fs";

async function openDiscardingChanges(services: Services, path: string): Promise<Database> {
    const temporaryPath = "/tmp/fk.db";
    fs.copyFileSync(path, temporaryPath);
    return await services.CreateDb().initialize(temporaryPath, false, false);
}

describe("Replay", () => {
    it.skip("load replay database and replay station reply", async () => {
        expect.assertions(1);

        const stationId = 14;
        const services = new ServicesImpl();
        const path = "/home/jlewallen/downloads/fk.db";
        const db = await openDiscardingChanges(services, path);

        await db.execute(`PRAGMA foreign_keys = OFF`);
        await db.execute(`DELETE FROM stations WHERE id != ?`, [stationId]);
        await db.execute(`DELETE FROM streams WHERE station_id != ?`, [stationId]);

        const store = services.Store();
        await store.dispatch(ActionTypes.LOAD_STATIONS);

        console.log(`loaded: ${store.state.stations.all.length}`);

        for (const station of store.state.stations.all) {
            console.log(station.decodeStatusReply());
        }

        const names = _.map(store.state.syncing.stations, (s) => [s.id, s.name]);
        console.log("names", names);

        const syncs: { [index: number]: StationSyncStatus } = _.keyBy(store.state.syncing.syncs, (s) => s.id);
        const stations: { [index: number]: Station } = _.keyBy(store.state.syncing.stations, (s) => s.id!);

        const station = stations[stationId];

        (station as any).serializedStatus = null;
        (station as any).serialized = null;

        // console.log("station", JSON.stringify(station, null, 2));

        const sync = syncs[stationId];
        console.log("sync", JSON.stringify(sync, null, 2));

        const dataOnly = sync.uploads.filter((file) => file.fileType == FileType.Data);
        console.log("sync", {
            readingsCopying: sync.readingsCopying,
            readingsReadyUpload: sync.readingsReadyUpload,
            readingsReadyDownload: sync.readingsReadyDownload,
            pathsToUpload: sync.getPathsToUpload(),
            pathsToUploadLength: sync.getPathsToUpload().length,
            uploads: dataOnly.map((f) => [f.blocks]),
        });

        const allDownloads = await db.query<{ path: string }>("SELECT * FROM downloads WHERE station_id = ? AND uploaded IS NULL", [
            stationId,
        ]);

        const keyed = _.keyBy(allDownloads, (d) => d.path);

        for (const pending of dataOnly) {
            if (pending.blocks < 0) {
                console.log("blocks", pending.blocks);
                if (false)
                    for (const file of pending.files) {
                        const download = keyed[file.path];
                        if (!download) throw new Error();
                        console.log("file", JSON.stringify(download, null, 2));
                    }

                if (false)
                    for (const file of pending.files) {
                        const download = keyed[file.path];
                        if (!download) throw new Error();
                        console.log("file", JSON.stringify(download, null, 2));
                    }
            }
        }

        await db.execute("UPDATE downloads SET uploaded = ?", [new Date()]);

        await store.dispatch(new ResetSyncStatusAction(sync.deviceId));

        expect(db).toBeDefined();
    });

    it.skip("inspecting notes media", async () => {
        expect.assertions(1);

        const services = new ServicesImpl();
        const path = "/home/jlewallen/fieldkit/mobile/app/tests/replay-cases/59524603-a46b-4e73-b3ee-d6f80565e546.db";
        await openDiscardingChanges(services, path);

        await deleteMissingAssets(services.Database());
    });
});

describe("utilities", () => {
    describe("rebaseAbsolutePath", () => {
        it("should replace pre-docs path with the docs path", () => {
            expect(rebaseAbsolutePath("/var/other-app/Documents/image/jacob.jpg")).toBe("/var/test-app/Documents/image/jacob.jpg");
        });

        it("should just append relative paths to the docs path", () => {
            expect(rebaseAbsolutePath("image/jacob.jpg")).toBe("/var/test-app/Documents/image/jacob.jpg");
        });
    });
});
