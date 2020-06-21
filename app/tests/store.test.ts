import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services } from "../services/services";
import { MockStationReplies } from "./utilities";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";

describe("Store", () => {
    let services;
    let mockStation;
    let store;

    beforeEach(async () => {
        services = new Services();
        mockStation = new MockStationReplies(services);
        await services.CreateDb().initialize();
        store = services.Store();

        store.commit(MutationTypes.SERVICES, () => services);
    });

    afterEach(() => {});

    describe("nearby stations", () => {
        it("should be blank to begin with and add stations when found", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(4);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);
            expect(store.getters.availableStations.length).toEqual(0);
            return store.dispatch(ActionTypes.FOUND, info).then(() => {
                expect(_.size(store.state.nearby.stations)).toEqual(1);
                expect(
                    _(store.getters.availableStations)
                        .filter(s => s.connected)
                        .size()
                ).toEqual(1);
            });
        });

        it("should remove stations when they're lost", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(3);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            expect(_.size(store.state.nearby.stations)).toEqual(0);
            return store.dispatch(ActionTypes.FOUND, info).then(() => {
                return store.dispatch(ActionTypes.LOST, info).then(() => {
                    expect(_.size(store.state.nearby.stations)).toEqual(0);
                    expect(
                        _(store.getters.availableStations)
                            .filter(s => s.connected)
                            .size()
                    ).toEqual(0);
                });
            });
        });

        it("should query nearby when told", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(1);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            return store.dispatch(ActionTypes.FOUND, info).then(() => {
                return store.dispatch(ActionTypes.QUERY_NECESSARY).then(() => {
                    expect(mockStation.mock.calls.length).toBe(1);
                });
            });
        });

        it("should query skip previously queried", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            expect.assertions(1);

            const info = { url: "http://127.0.0.1", deviceId: station.deviceId };

            store.dispatch(ActionTypes.FOUND, info);
            return store.dispatch(ActionTypes.QUERY_NECESSARY).then(() => {
                return store.dispatch(ActionTypes.QUERY_NECESSARY).then(() => {
                    expect(mockStation.mock.calls.length).toBe(1);
                });
            });
        });
    });

    describe("stations", () => {
        it("loading", () => {
            expect.assertions(1);

            return store.dispatch(ActionTypes.LOAD).then(v => {
                const statusReply = mockStation.newFakeStatusReply(mockStation.newFakeStation());
                return store.dispatch(ActionTypes.REPLY, statusReply).then(() => {
                    expect(true).toBe(true);
                });
            });
        });
    });
});
