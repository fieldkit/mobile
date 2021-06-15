import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { MockStationReplies } from "./utilities";
import { debug } from "@/lib";
import {
    PhoneLocation,
    OpenProgressMutation,
    CommonLocations,
    StationRepliedAction,
    MutationTypes,
    ActionTypes,
    TryStationOnceAction,
} from "@/store";
import { ServicesImpl, ServiceRef } from "@/services";
import { nearby } from "@/store/modules/nearby";
import { fk_app } from "fk-app-protocol/fk-app";
import FakeTimers from "@sinonjs/fake-timers";

describe("Store", () => {
    let services;
    let mockStation;
    let store;
    let clock;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 40 });
        clock.tick(10);

        services = new ServicesImpl();
        mockStation = new MockStationReplies(services);
        await services.CreateDb().initialize();
        store = services.Store();
    });

    afterEach(() => {});

    describe("importing typed messages", () => {
        it("should work", () => {
            const HttpReply = fk_app.HttpReply;
            debug.log(HttpReply);
        });
    });

    describe("nearby stations, with TRY_STATION", () => {
        it("should retry quickly if initial query fails", async () => {
            expect.assertions(5);

            const station = mockStation.newFakeStation();
            mockStation.queueNoReply();
            mockStation.queueStatusReply(station);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);
            expect(store.getters.availableStations.length).toEqual(0);
            await store.dispatch(ActionTypes.FOUND, info);

            // clock.tick(400);
            // We queue both above and actually wait for the delay
            // here. This could be a better test.
            expect(mockStation.mock.calls.length).toBe(2);

            expect(_.size(store.state.nearby.stations)).toEqual(1);
            expect(
                _(store.getters.availableStations)
                    .filter((s) => s.connected)
                    .size()
            ).toEqual(1);
        });
    });

    describe("nearby stations", () => {
        beforeEach(() => {
            store.hotUpdate({
                modules: {
                    nearby: {
                        actions: _.extend(nearby(new ServiceRef(() => services)).actions, {
                            [ActionTypes.TRY_STATION]: () => {
                                return Promise.resolve();
                            },
                        }),
                    },
                },
            });
        });

        describe("try once", () => {
            it("should ignore replies from stations with unexpected device ids", async () => {
                expect.assertions(3);

                const wrong = mockStation.newFakeStation();
                const station = mockStation.newFakeStation();
                mockStation.queueStatusReply(station);

                expect(_.size(store.state.nearby.stations)).toEqual(0);
                const info = { url: "http://127.0.0.1", deviceId: wrong.deviceId };

                await store.dispatch(new TryStationOnceAction(info));
                expect(_.size(store.state.nearby.stations)).toEqual(1);
                expect(Object.keys(store.state.nearby.stations)).toEqual([station.deviceId]);
            });
        });

        it("should appear in discovering stations until queried", async () => {
            const station = mockStation.newFakeStation();

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect.assertions(4);

            expect(_.size(store.state.nearby.stations)).toEqual(0);

            store.commit(MutationTypes.FIND, info);

            expect(_.size(store.state.nearby.stations)).toEqual(1);

            store.commit(MutationTypes.STATION_QUERIED, info);

            expect(_.size(store.state.nearby.stations)).toEqual(1);
            expect(store.getters.availableStations.length).toEqual(0);
        });

        it("should be blank to begin with and add stations when found", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(4);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);
            expect(store.getters.availableStations.length).toEqual(0);
            await store.dispatch(ActionTypes.FOUND, info);

            expect(_.size(store.state.nearby.stations)).toEqual(1);
            expect(
                _(store.getters.availableStations)
                    .filter((s) => s.connected)
                    .size()
            ).toEqual(1);
        });

        it("should lose stations after inactivity unless they're transferring", async () => {
            const station = mockStation.newFakeStation();

            expect.assertions(5);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);

            mockStation.queueStatusReply(station);
            await store.dispatch(ActionTypes.FOUND, info);

            const s0 = _(store.getters.availableStations)
                .filter((s) => s.connected)
                .size();
            expect(s0).toEqual(1);

            expect(_.size(store.state.nearby.stations)).toEqual(1);

            clock.tick(10005);

            mockStation.queueNoReply();
            try {
                await store.dispatch(ActionTypes.REFRESH);
            } catch (e) {
                debug.log("ignored, expected", e);
            }

            const s1 = _(store.getters.availableStations)
                .filter((s) => s.connected)
                .size();
            expect(s1).toEqual(1);

            clock.tick(50000);

            await store.commit(new OpenProgressMutation(info.deviceId, true, 0));

            await store.dispatch(ActionTypes.REFRESH);

            const s2 = _(store.getters.availableStations)
                .filter((s) => s.connected)
                .size();
            expect(s2).toEqual(1);
        });

        it("should lose stations after inactivity", async () => {
            const station = mockStation.newFakeStation();

            expect.assertions(5);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);

            mockStation.queueStatusReply(station);
            await store.dispatch(ActionTypes.FOUND, info);

            const s0 = _(store.getters.availableStations)
                .filter((s) => s.connected)
                .size();
            expect(s0).toEqual(1);

            expect(_.size(store.state.nearby.stations)).toEqual(1);

            clock.tick(10005);

            mockStation.queueNoReply();
            try {
                await store.dispatch(ActionTypes.REFRESH);
            } catch (e) {
                debug.log("ignored, expected", e);
            }

            const s1 = _(store.getters.availableStations)
                .filter((s) => s.connected)
                .size();
            expect(s1).toEqual(1);

            clock.tick(50000);

            await store.dispatch(ActionTypes.REFRESH);

            const s2 = _(store.getters.availableStations)
                .filter((s) => s.connected)
                .size();
            expect(s2).toEqual(0);
        });

        it("should remove stations when they're lost", async () => {
            const station = mockStation.newFakeStation();

            expect.assertions(3);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);

            mockStation.queueStatusReply(station);
            await store.dispatch(ActionTypes.FOUND, info);

            await store.dispatch(ActionTypes.LOST, info);
            expect(_.size(store.state.nearby.stations)).toEqual(0);

            const s = _(store.getters.availableStations)
                .filter((s) => s.connected)
                .size();
            expect(s).toEqual(0);
        });

        it("should query station when found", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(4);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.FOUND, info);

            expect(mockStation.mock.calls.length).toBe(1);
            expect(store.state.stations.all[0].modules.length).toBe(4);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
            expect(store.state.stations.all[0].streams.length).toBe(2);
        });

        it("should query skip previously queried", async () => {
            const station = mockStation.newFakeStation();

            expect.assertions(3);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(mockStation.mock.calls.length).toBe(0);

            mockStation.queueStatusReply(station);
            await store.dispatch(ActionTypes.FOUND, info);

            expect(mockStation.mock.calls.length).toBe(1);
            clock.tick(1005);

            await store.dispatch(ActionTypes.QUERY_NECESSARY);
            expect(mockStation.mock.calls.length).toBe(1);
        });

        it("should query again after delay", async () => {
            expect.assertions(5);

            const station = mockStation.newFakeStation();

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(mockStation.mock.calls.length).toBe(0);

            mockStation.queueStatusReply(station);
            await store.dispatch(ActionTypes.FOUND, info);

            clock.tick(1000);
            expect(mockStation.mock.calls.length).toBe(1);

            await store.dispatch(ActionTypes.QUERY_NECESSARY);

            clock.tick(9005);

            expect(mockStation.mock.calls.length).toBe(1);
            mockStation.queueStatusReply(station);
            await store.dispatch(ActionTypes.QUERY_NECESSARY);
            expect(mockStation.mock.calls.length).toBe(2);

            expect(store.state.stations.all[0].streams.length).toBe(2);
        });
    });

    describe("stations store module", () => {
        it("loading status reply", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(3);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.LOAD);
            await store.dispatch(ActionTypes.QUERY_STATION, info);

            expect(store.state.stations.all.length).toBe(1);
            expect(store.state.stations.all[0].modules.length).toBe(4);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
        });

        it("loading readings reply", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueReadingsReply(station);

            expect.assertions(7);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.LOAD);
            await store.dispatch(ActionTypes.QUERY_STATION, info);

            debug.log(store.state.stations.all[0].modules[0].sensors.map((s) => s.reading));

            expect(store.state.stations.all.length).toBe(1);
            expect(store.state.stations.all[0].modules.length).toBe(4);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
            expect(store.state.stations.all[0].modules[0].sensors.map((s) => s.position)).toEqual([0, 1]);
            expect(store.state.stations.all[0].modules[0].sensors.map((s) => s.reading)).toEqual([100 * 1, 200 * 1]);
            expect(store.state.stations.all[0].modules[0].sensors[0].reading).toBe(100);
            expect(store.state.stations.all[0].modules[0].sensors[1].reading).toBe(200);
        });

        it("loading readings reply twice updates readings", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueReadingsReply(station);
            mockStation.queueReadingsReply(station);

            expect.assertions(7);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.LOAD);
            await store.dispatch(ActionTypes.QUERY_STATION, info);
            await store.dispatch(ActionTypes.QUERY_STATION, info);

            debug.log(store.state.stations.all[0].modules[0].sensors.map((s) => s.reading));

            expect(store.state.stations.all.length).toBe(1);
            expect(store.state.stations.all[0].modules.length).toBe(4);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
            expect(store.state.stations.all[0].modules[0].sensors.map((s) => s.position)).toEqual([0, 1]);
            expect(store.state.stations.all[0].modules[0].sensors.map((s) => s.reading)).toEqual([100 * 2, 200 * 2]);
            expect(store.state.stations.all[0].modules[0].sensors[0].reading).toBe(100 * 2);
            expect(store.state.stations.all[0].modules[0].sensors[1].reading).toBe(200 * 2);
        });
    });

    function locationToGpsStatus(location: PhoneLocation): any {
        return {
            enabled: false,
            fix: false,
            time: location.time,
            latitude: location.latitude,
            longitude: location.longitude,
            altitude: 0,
        };
    }

    describe("map", () => {
        it("should center on the phone's location", async () => {
            store.commit(MutationTypes.PHONE_LOCATION, CommonLocations.ConservifyLab);
            expect(store.getters.mappedStations.center.location).toEqual(CommonLocations.ConservifyLab.location());
        });

        it("should include all nearby stations", async () => {
            expect.assertions(3);

            const station1 = mockStation.newFakeStation();
            const station2 = mockStation.newFakeStation();

            const reply1 = mockStation.newFakeStatusReply(station1, locationToGpsStatus(CommonLocations.ConservifyLab));
            const reply2 = mockStation.newFakeStatusReply(station2, locationToGpsStatus(CommonLocations.DowntownLA));

            await store.dispatch(new StationRepliedAction(reply1, "http://10.0.01/fk/v1"));
            await store.dispatch(new StationRepliedAction(reply2, "http://10.0.01/fk/v1"));

            expect(Object.keys(store.state.map.stations).length).toBe(2);
            expect(store.state.map.stations[station1.deviceId].location).toEqual(CommonLocations.ConservifyLab.location());
            expect(store.state.map.stations[station2.deviceId].location).toEqual(CommonLocations.DowntownLA.location());
        });
    });
});
