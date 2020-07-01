import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services } from "../services/services";
import { prepareReply } from "../services/query-station";
import { MockStationReplies } from "./utilities";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";
import FakeTimers from "@sinonjs/fake-timers";
import { getPathTimestamp } from "../utilities";

import { FileType } from "../store/types";
import { StationSyncStatus, FileDownload } from "../store/modules/syncing";

describe("Syncing", () => {
    let services;
    let store;
    let clock;
    let mockStation;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 1000 });
        clock.tick(10);

        services = new Services();
        await services.CreateDb().initialize();
        mockStation = new MockStationReplies(services);

        store = services.Store();

        store.commit(MutationTypes.SERVICES, () => services);
    });

    afterEach(() => {});

    describe("no stations anywhere", () => {
        it("should be blank to begin with", async () => {
            expect.assertions(1);

            expect(_.size(store.getters.syncs)).toEqual(0);
        });
    });

    function makePath(deviceId, time, typeName) {
        return [deviceId, getPathTimestamp(time), typeName + ".fkpb"].join("/");
    }

    describe("one station", () => {
        it("first sync, should download all of both files", async () => {
            expect.assertions(2);

            const fake = mockStation.newFakeStation();

            const streams1 = mockStation.newStreams(1, 100);
            const reply1 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.STATION_REPLY, reply1);

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, [
                    new FileDownload(FileType.Meta, "/fk/v1/download/meta", makePath(saved.deviceId, new Date(), "meta"), 0, 1, 126),
                    new FileDownload(FileType.Data, "/fk/v1/download/data", makePath(saved.deviceId, new Date(), "data"), 0, 100, 68900),
                ]),
            ]);

            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, []),
            ]);
        });

        it("second sync, no additional data", async () => {
            expect.assertions(2);

            const fake = mockStation.newFakeStation();

            const streams1 = mockStation.newStreams(1, 100);
            const reply1 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.STATION_REPLY, reply1);

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, [
                    new FileDownload(FileType.Meta, "/fk/v1/download/meta", makePath(saved.deviceId, new Date(), "meta"), 0, 1, 126),
                    new FileDownload(FileType.Data, "/fk/v1/download/data", makePath(saved.deviceId, new Date(), "data"), 0, 100, 68900),
                ]),
            ]);

            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            await store.dispatch(ActionTypes.STATION_REPLY, reply1);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, []),
            ]);
        });

        it("second sync, additional data, should download tail", async () => {
            expect.assertions(3);

            const fake = mockStation.newFakeStation();

            const streams1 = mockStation.newStreams(1, 100);
            const reply1 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.STATION_REPLY, reply1);

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, [
                    new FileDownload(FileType.Meta, "/fk/v1/download/meta", makePath(saved.deviceId, new Date(), "meta"), 0, 1, 126),
                    new FileDownload(FileType.Data, "/fk/v1/download/data", makePath(saved.deviceId, new Date(), "data"), 0, 100, 68900),
                ]),
            ]);

            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, []),
            ]);

            clock.tick(60000);

            const streams2 = mockStation.newStreams(1, 200);
            const reply2 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams2));
            await store.dispatch(ActionTypes.STATION_REPLY, reply2);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, [
                    new FileDownload(
                        FileType.Data,
                        "/fk/v1/download/data?first=100",
                        makePath(saved.deviceId, new Date(), "data"),
                        100,
                        200,
                        68900
                    ),
                ]),
            ]);
        });

        it("second sync, additional meta and additional data, should download tails", async () => {
            expect.assertions(3);

            const fake = mockStation.newFakeStation();

            const streams1 = mockStation.newStreams(1, 100);
            const reply1 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.STATION_REPLY, reply1);

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, [
                    new FileDownload(FileType.Meta, "/fk/v1/download/meta", makePath(saved.deviceId, new Date(), "meta"), 0, 1, 126),
                    new FileDownload(FileType.Data, "/fk/v1/download/data", makePath(saved.deviceId, new Date(), "data"), 0, 100, 68900),
                ]),
            ]);

            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, []),
            ]);

            clock.tick(60000);

            const streams2 = mockStation.newStreams(5, 200);
            const reply2 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams2));
            await store.dispatch(ActionTypes.STATION_REPLY, reply2);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(saved.id, saved.deviceId, saved.generationId, saved.name, false, new Date(), new Date(), true, [
                    new FileDownload(
                        FileType.Meta,
                        "/fk/v1/download/meta?first=1",
                        makePath(saved.deviceId, new Date(), "meta"),
                        1,
                        5,
                        504
                    ),
                    new FileDownload(
                        FileType.Data,
                        "/fk/v1/download/data?first=100",
                        makePath(saved.deviceId, new Date(), "data"),
                        100,
                        200,
                        68900
                    ),
                ]),
            ]);
        });
    });
});
