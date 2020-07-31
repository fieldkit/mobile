import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services } from "../services/services";
import { prepareReply } from "../services/query-station";
import { MockStationReplies } from "./utilities";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";
import FakeTimers from "@sinonjs/fake-timers";
import { PhoneLocation, CommonLocations } from "../store/types";

describe("Store", () => {
    let services;
    let mockStation;
    let store;
    let clock;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 40 });
        clock.tick(10);

        services = new Services();
        mockStation = new MockStationReplies(services);
        await services.CreateDb().initialize();
        store = services.Store();

        store.commit(MutationTypes.SERVICES, () => services);
    });

    afterEach(() => {});

    describe("nearby stations", () => {
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
                console.log("ignored, expected", e);
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
            expect(store.state.stations.all[0].modules.length).toBe(1);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
            expect(store.state.stations.all[0].streams.length).toBe(2);
        });

        it("should query skip previously queried", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(1);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.FOUND, info);
            clock.tick(1005);
            await store.dispatch(ActionTypes.QUERY_NECESSARY);
            expect(mockStation.mock.calls.length).toBe(1);
        });

        it("should query again after delay", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);
            mockStation.queueStatusReply(station);

            expect.assertions(3);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.FOUND, info);
            clock.tick(1000);
            await store.dispatch(ActionTypes.QUERY_NECESSARY);
            clock.tick(9005);
            expect(mockStation.mock.calls.length).toBe(1);
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
            expect(store.state.stations.all[0].modules.length).toBe(1);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
        });

        it("loading readings reply", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueReadingsReply(station);

            expect.assertions(5);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.LOAD);
            await store.dispatch(ActionTypes.QUERY_STATION, info);

            expect(store.state.stations.all.length).toBe(1);
            expect(store.state.stations.all[0].modules.length).toBe(1);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
            expect(store.state.stations.all[0].modules[0].sensors[0].reading).toBe(100);
            expect(store.state.stations.all[0].modules[0].sensors[1].reading).toBe(200);
        });

        it("loading readings reply twice updates readings", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueReadingsReply(station);
            mockStation.queueReadingsReply(station);

            expect.assertions(5);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.LOAD);
            await store.dispatch(ActionTypes.QUERY_STATION, info);
            await store.dispatch(ActionTypes.QUERY_STATION, info);

            expect(store.state.stations.all.length).toBe(1);
            expect(store.state.stations.all[0].modules.length).toBe(1);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
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
        it("should begin with no default location", async () => {
            expect(store.getters.mappedStations).toBe(null);
        });

        it("should center on the phone's location", async () => {
            expect(store.getters.mappedStations).toBe(null);
            store.commit(MutationTypes.PHONE_LOCATION, CommonLocations.ConservifyLab);
            expect(store.getters.mappedStations.center.location).toEqual(CommonLocations.ConservifyLab.location());
        });

        it("should include all nearby stations", async () => {
            expect.assertions(3);

            const station1 = mockStation.newFakeStation();
            const station2 = mockStation.newFakeStation();

            const reply1 = prepareReply(mockStation.newFakeStatusReply(station1, locationToGpsStatus(CommonLocations.ConservifyLab)));
            const reply2 = prepareReply(mockStation.newFakeStatusReply(station2, locationToGpsStatus(CommonLocations.DowntownLA)));

            await store.dispatch(ActionTypes.STATION_REPLY, reply1);
            await store.dispatch(ActionTypes.STATION_REPLY, reply2);

            expect(Object.keys(store.state.map.stations).length).toBe(2);
            expect(store.state.map.stations[station1.deviceId].location).toEqual(CommonLocations.ConservifyLab.location());
            expect(store.state.map.stations[station2.deviceId].location).toEqual(CommonLocations.DowntownLA.location());
        });
    });
});
