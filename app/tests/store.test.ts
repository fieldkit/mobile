import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services } from "../services/services";
import { MockStationReplies } from "./utilities";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";
import FakeTimers from "@sinonjs/fake-timers";

describe("Store", () => {
    let services;
    let mockStation;
    let store;
    let clock;

    beforeEach(async () => {
        services = new Services();
        mockStation = new MockStationReplies(services);
        await services.CreateDb().initialize();
        store = services.Store();

        store.commit(MutationTypes.SERVICES, () => services);

        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 40 });
        clock.tick(10);
    });

    afterEach(() => {});

    describe("nearby stations", () => {
        it("should be blank to begin with and add stations when found", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(4);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);
            expect(store.getters.availableStations(new Date()).length).toEqual(0);
            await store.dispatch(ActionTypes.FOUND, info);

            expect(_.size(store.state.nearby.stations)).toEqual(1);
            expect(
                _(store.getters.availableStations(new Date()))
                    .filter(s => s.connected)
                    .size()
            ).toEqual(1);
        });

        it("should lose stations after inactivity", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(4);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);

            await store.dispatch(ActionTypes.FOUND, info);

            expect(_.size(store.state.nearby.stations)).toEqual(1);

            clock.tick(10005);

            const s1 = _(store.getters.availableStations(new Date()))
                .filter(s => s.connected)
                .size();
            expect(s1).toEqual(1);

            clock.tick(50000);

            const s2 = _(store.getters.availableStations(new Date()))
                .filter(s => s.connected)
                .size();
            expect(s2).toEqual(0);
        });

        it("should remove stations when they're lost", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(3);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);
            await store.dispatch(ActionTypes.FOUND, info);
            await store.dispatch(ActionTypes.LOST, info);
            expect(_.size(store.state.nearby.stations)).toEqual(0);

            const s = _(store.getters.availableStations(new Date()))
                .filter(s => s.connected)
                .size();
            expect(s).toEqual(0);
        });

        it("should query station when found", async () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(3);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.FOUND, info);

            expect(mockStation.mock.calls.length).toBe(1);
            expect(store.state.stations.all[0].modules.length).toBe(1);
            expect(store.state.stations.all[0].modules[0].sensors.length).toBe(2);
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

            expect.assertions(2);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            await store.dispatch(ActionTypes.FOUND, info);
            clock.tick(1000);
            await store.dispatch(ActionTypes.QUERY_NECESSARY);
            clock.tick(9005);
            expect(mockStation.mock.calls.length).toBe(1);
            await store.dispatch(ActionTypes.QUERY_NECESSARY);
            expect(mockStation.mock.calls.length).toBe(2);
        });
    });

    describe("stations", () => {
        it("loading", async () => {
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
    });
});
