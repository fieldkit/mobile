import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { ServicesImpl } from "@/services";
import { MockStationReplies } from "./utilities";
import { ActionTypes, StationPortalAcceptedStatus, StationRepliedAction } from "@/store";

describe("portal sync", () => {
    describe("portal identifier", () => {
        let $s;
        let store;

        beforeEach(async () => {
            const services = new ServicesImpl();
            await services.CreateDb().initialize(null, false, false);
            const mockStation = new MockStationReplies(services);
            const fake = mockStation.newFakeStation();
            const reply = mockStation.newFakeStatusReply(fake, null, null);

            store = services.Store();
            await store.dispatch(new StationRepliedAction(reply, "http://10.0.01/fk/v1"));

            $s = services;
        });

        it("should update when changed", async () => {
            expect.assertions(4);

            const payload: StationPortalAcceptedStatus = {
                id: 1,
                portalId: 100,
                error: null,
            };

            expect(store.state.stations.all[0].portalId).toBeNull();

            const spy = jest.spyOn($s.Database(), "updateStationPortalId");

            await store.dispatch(ActionTypes.STATION_PORTAL_REPLY, payload);

            expect(spy.mock.calls.length).toBe(1);

            expect(store.state.stations.all[0].portalId).toBe(100);

            await store.dispatch(ActionTypes.STATION_PORTAL_REPLY, payload);

            expect(store.state.stations.all[0].portalId).toBe(100);
        });
    });
});
