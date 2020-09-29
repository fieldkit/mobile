import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services } from "../services/services";
import { prepareReply } from "../services/query-station";
import { MockStationReplies } from "./utilities";
import * as ActionTypes from "@/store/actions";
import * as MutationTypes from "@/store/mutations";
import FakeTimers from "@sinonjs/fake-timers";
import { getPathTimestamp } from "../utilities";

import { FileTypeUtils, FileType, TransferProgress } from "@/store/types";
import { StationSyncStatus, PendingDownload, PendingUpload, LocalFile, TransferError, StationProgress } from "@/store/modules/syncing";
import { StationRepliedAction } from "@/store/typed-actions";

describe("Progress", () => {
    let sp: StationProgress;

    beforeEach(() => {
        sp = new StationProgress("device-id", true, 0);
    });

    it("should track progress over multiple downloads", () => {
        console.log("_________________________________________________________");
        console.log(sp);

        expect(sp.decimal).toEqual(0.0);

        sp = sp.include(new TransferProgress("device-id", "path-1", 100, 0));

        expect(sp.decimal).toEqual(0.0);

        sp = sp.include(new TransferProgress("device-id", "path-1", 100, 50));

        expect(sp.decimal).toEqual(0.5);

        sp = sp.include(new TransferProgress("device-id", "path-1", 100, 100));

        expect(sp.decimal).toEqual(1.0);

        sp = sp.include(new TransferProgress("device-id", "path-2", 100, 0));

        expect(sp.decimal).toEqual(0.5);

        sp = sp.include(new TransferProgress("device-id", "path-2", 100, 50));

        expect(sp.decimal).toEqual(0.75);
    });
});

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

    function makePath(deviceId, time, fileType) {
        return ["downloads", deviceId, getPathTimestamp(time), FileTypeUtils.toString(fileType) + ".fkpb"].join("/");
    }

    describe("one station", () => {
        it("first sync, should download all of both files", async () => {
            expect.assertions(2);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    0,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            0,
                            1,
                            126
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            0,
                            100,
                            68900
                        ),
                    ],
                    []
                ),
            ]);

            mockStation.queueDownload(200, { "fk-blocks": "0,1" });
            mockStation.queueDownload(200, { "fk-blocks": "0,100" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    100,
                    0,
                    [],
                    [
                        new PendingUpload(FileType.Meta, 0, 1, 126, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Meta), 126),
                        ]),
                        new PendingUpload(FileType.Data, 0, 100, 68900, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);
        });

        it("first sync, fails", async () => {
            expect.assertions(3);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    0,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            0,
                            1,
                            126
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            0,
                            100,
                            68900
                        ),
                    ],
                    []
                ),
            ]);

            mockStation.queueDownload(500, {});
            try {
                await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);
            } catch (error) {
                expect(error).toBeDefined();
            }

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    0,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            0,
                            1,
                            126
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            0,
                            100,
                            68900
                        ),
                    ],
                    [],
                    null,
                    TransferError.Other
                ),
            ]);
        });

        it("second sync, no additional data", async () => {
            expect.assertions(2);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    0,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            0,
                            1,
                            126
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            0,
                            100,
                            68900
                        ),
                    ],
                    []
                ),
            ]);

            mockStation.queueDownload(200, { "fk-blocks": "0,1" });
            mockStation.queueDownload(200, { "fk-blocks": "0,100" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    100,
                    0,
                    [],
                    [
                        new PendingUpload(FileType.Meta, 0, 1, 126, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Meta), 126),
                        ]),
                        new PendingUpload(FileType.Data, 0, 100, 68900, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);
        });

        it("second sync, additional data, should download tail", async () => {
            expect.assertions(3);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    0,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            0,
                            1,
                            126
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            0,
                            100,
                            68900
                        ),
                    ],
                    []
                ),
            ]);

            mockStation.queueDownload(200, { "fk-blocks": "0,1" });
            mockStation.queueDownload(200, { "fk-blocks": "0,100" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    100,
                    0,
                    [],
                    [
                        new PendingUpload(FileType.Meta, 0, 1, 126, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Meta), 126),
                        ]),
                        new PendingUpload(FileType.Data, 0, 100, 68900, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);

            const downloadTime = new Date();

            clock.tick(60000);

            const streams2 = mockStation.newStreams(1, 200);
            const reply2 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams2));
            await store.dispatch(new StationRepliedAction(reply2, "http://10.0.01/fk/v1"));

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    100,
                    0,
                    [
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data?first=100",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            100,
                            200,
                            68900
                        ),
                    ],
                    [
                        new PendingUpload(FileType.Meta, 0, 1, 126, [
                            new LocalFile(makePath(saved.deviceId, downloadTime, FileType.Meta), 126),
                        ]),
                        new PendingUpload(FileType.Data, 0, 100, 68900, [
                            new LocalFile(makePath(saved.deviceId, downloadTime, FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);
        });

        it("second sync, additional meta and additional data, should download tails", async () => {
            expect.assertions(4);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    0,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            0,
                            1,
                            126
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            0,
                            100,
                            68900
                        ),
                    ],
                    []
                ),
            ]);

            mockStation.queueDownload(200, { "fk-blocks": "0,1" });
            mockStation.queueDownload(200, { "fk-blocks": "0,100" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    100,
                    0,
                    [],
                    [
                        new PendingUpload(FileType.Meta, 0, 1, 126, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Meta), 126),
                        ]),
                        new PendingUpload(FileType.Data, 0, 100, 68900, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);

            const firstDownloadTime = new Date();

            clock.tick(60000);

            const streams2 = mockStation.newStreams(5, 200);
            const reply2 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams2));
            await store.dispatch(new StationRepliedAction(reply2, "http://10.0.01/fk/v1"));

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    100,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta?first=1",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            1,
                            5,
                            504
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data?first=100",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            100,
                            200,
                            68900
                        ),
                    ],
                    [
                        new PendingUpload(FileType.Meta, 0, 1, 126, [
                            new LocalFile(makePath(saved.deviceId, firstDownloadTime, FileType.Meta), 126),
                        ]),
                        new PendingUpload(FileType.Data, 0, 100, 68900, [
                            new LocalFile(makePath(saved.deviceId, firstDownloadTime, FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);

            mockStation.queueDownload(200, { "fk-blocks": "1,5" });
            mockStation.queueDownload(200, { "fk-blocks": "100,200" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    200,
                    0,
                    [],
                    [
                        new PendingUpload(FileType.Meta, 0, 5, 630, [
                            new LocalFile(makePath(saved.deviceId, firstDownloadTime, FileType.Meta), 126),
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Meta), 504),
                        ]),
                        new PendingUpload(FileType.Data, 0, 200, 2 * 68900, [
                            new LocalFile(makePath(saved.deviceId, firstDownloadTime, FileType.Data), 68900),
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);
        });

        it("one synchronization cycle", async () => {
            expect.assertions(7);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs.length).toStrictEqual(1);
            expect(store.getters.syncs[0].downloads.length).toStrictEqual(2);
            expect(store.getters.syncs[0].uploads.length).toStrictEqual(0);

            mockStation.queueDownload(200, { "fk-blocks": "0,1" });
            mockStation.queueDownload(200, { "fk-blocks": "0,100" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs.length).toStrictEqual(1);
            expect(store.getters.syncs[0].downloads.length).toStrictEqual(0);
            expect(store.getters.syncs[0].uploads.length).toStrictEqual(2);

            mockStation.queueUpload(200, {});
            mockStation.queueUpload(200, {});
            await store.dispatch(ActionTypes.UPLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    100,
                    100,
                    [],
                    []
                ),
            ]);
        });

        it("two synchronization cycles", async () => {
            expect.assertions(7);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs.length).toStrictEqual(1);
            expect(store.getters.syncs[0].downloads.length).toStrictEqual(2);
            expect(store.getters.syncs[0].uploads.length).toStrictEqual(0);

            mockStation.queueDownload(200, { "fk-blocks": "0,1" });
            mockStation.queueDownload(200, { "fk-blocks": "0,100" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs.length).toStrictEqual(1);
            expect(store.getters.syncs[0].downloads.length).toStrictEqual(0);
            expect(store.getters.syncs[0].uploads.length).toStrictEqual(2);

            mockStation.queueUpload(200, {});
            mockStation.queueUpload(200, {});
            await store.dispatch(ActionTypes.UPLOAD_ALL, store.getters.syncs);

            const streams2 = mockStation.newStreams(5, 200);
            const reply2 = prepareReply(mockStation.newFakeStatusReply(fake, null, streams2));
            await store.dispatch(new StationRepliedAction(reply2, "http://10.0.01/fk/v1"));

            mockStation.queueDownload(200, { "fk-blocks": "1,5" });
            mockStation.queueDownload(200, { "fk-blocks": "100,200" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            mockStation.queueUpload(200, {});
            mockStation.queueUpload(200, {});
            await store.dispatch(ActionTypes.UPLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    200,
                    200,
                    [],
                    []
                ),
            ]);
        });

        it("downloading and getting more readings than was asked for", async () => {
            expect.assertions(2);

            const fake = mockStation.newFakeStation();
            const streams1 = mockStation.newStreams(1, 100);
            mockStation.queueBody(mockStation.newFakeStatusReply(fake, null, streams1));
            await store.dispatch(ActionTypes.FOUND, { url: "http://127.0.0.1", deviceId: fake.deviceId });

            const saved = store.state.stations.all[0];

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    0,
                    0,
                    [
                        new PendingDownload(
                            FileType.Meta,
                            "http://127.0.0.1/download/meta",
                            makePath(saved.deviceId, new Date(), FileType.Meta),
                            0,
                            1,
                            126
                        ),
                        new PendingDownload(
                            FileType.Data,
                            "http://127.0.0.1/download/data",
                            makePath(saved.deviceId, new Date(), FileType.Data),
                            0,
                            100,
                            68900
                        ),
                    ],
                    []
                ),
            ]);

            mockStation.queueDownload(200, { "fk-blocks": "0,1" });
            mockStation.queueDownload(200, { "fk-blocks": "0,110" });
            await store.dispatch(ActionTypes.DOWNLOAD_ALL, store.getters.syncs);

            expect(store.getters.syncs).toStrictEqual([
                new StationSyncStatus(
                    saved.id,
                    saved.deviceId,
                    saved.generationId,
                    saved.name,
                    true,
                    new Date(),
                    new Date(),
                    110,
                    0,
                    [],
                    [
                        new PendingUpload(FileType.Meta, 0, 1, 126, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Meta), 126),
                        ]),
                        new PendingUpload(FileType.Data, 0, 110, 68900, [
                            new LocalFile(makePath(saved.deviceId, new Date(), FileType.Data), 68900),
                        ]),
                    ]
                ),
            ]);
        });
    });
});
