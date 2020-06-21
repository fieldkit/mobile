import storeFactory from "../store";
import { Services } from "../services/services";
import { MockStationReplies } from "./utilities";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";

describe("Store", () => {
    let services;
    let mockStation;
    let db;
    let url = "http://127.0.0.1";
    let deviceId = "device-id";
    let store;

    beforeEach(async () => {
        services = new Services();
        mockStation = new MockStationReplies(services);
        db = services.Database();
        await services.CreateDb().initialize();
        store = storeFactory();

        store.commit(MutationTypes.SERVICES, () => services);
    });

    afterEach(() => {});

    describe("created", () => {
        it("should be blank to begin with", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            store.dispatch(ActionTypes.FOUND, { url: url, deviceId: deviceId });
        });

        it("should query nearby when told", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            store.dispatch(ActionTypes.FOUND, { url: url, deviceId: deviceId });
            store.dispatch(ActionTypes.QUERY_NECESSARY);
        });

        it("should query skip previously queried", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            store.dispatch(ActionTypes.FOUND, { url: url, deviceId: deviceId });
            return store.dispatch(ActionTypes.QUERY_NECESSARY).then(() => {
                return store.dispatch(ActionTypes.QUERY_NECESSARY);
            });
        });

        it("should be blank to begin with", () => {
            const station = mockStation.newFakeStation();
            mockStation.queueStatusReply(station);

            store.dispatch(ActionTypes.FOUND, { url: url, deviceId: deviceId });
            store.dispatch(ActionTypes.LOST, { url: url, deviceId: deviceId });
        });
    });

    describe("stations", () => {
        it("loading", () => {
            return store.dispatch(ActionTypes.LOAD).then(v => {
                const statusReply = {
                    status: {
                        identity: {
                            deviceId: "device-id",
                            generationId: "generation-id",
                            name: "Fake Station",
                        },
                    },
                };
                return store.dispatch(ActionTypes.REPLY, statusReply).then(() => {
                    return store.dispatch(ActionTypes.REPLY, statusReply);
                });
            });
        });
    });
});
