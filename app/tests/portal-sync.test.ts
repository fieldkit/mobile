import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { ServiceRef, ServicesImpl } from "@/services";
import { MockStationReplies } from "./utilities";
import { ActionTypes, PortalReplyAction, PortalErrorAction, StationRepliedAction } from "@/store";
import { stations } from "@/store/modules/stations";

// const actionsInjector = require("inject-loader!./actions");

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

            const payload = new PortalReplyAction(1, 100, 1);

            expect(store.state.stations.all[0].portalId).toBeNull();

            const spy = jest.spyOn($s.Database(), "updateStationPortalId");

            await store.dispatch(payload);

            expect(spy.mock.calls.length).toBe(1);

            expect(store.state.stations.all[0].portalId).toBe(100);

            await store.dispatch(payload);

            expect(store.state.stations.all[0].portalId).toBe(100);
        });

        it("should skip action reply when portal identifier unchanged", async () => {
            expect.assertions(5);

            const sm = stations(new ServiceRef(() => $s)) as any;
            const payload = new PortalReplyAction(1, 100, 1);

            const store = $s.Store();
            const commitSpy = jest.spyOn(store, "commit");
            const action = sm.actions[ActionTypes.STATION_PORTAL_REPLY];
            const state = store.state.stations;

            expect(store.state.stations.all[0].portalId).toBeNull();

            await action({ commit: store.commit, state: state }, payload);

            expect(commitSpy.mock.calls.length).toBe(1);

            expect(store.state.stations.all[0].portalId).toBe(100);

            await action({ commit: store.commit, state: state }, payload);

            expect(commitSpy.mock.calls.length).toBe(1);

            expect(store.state.stations.all[0].portalId).toBe(100);
        });

        it("should skip action reply when error unchanged", async () => {
            expect.assertions(5);

            const sm = stations(new ServiceRef(() => $s)) as any;
            const payload = new PortalErrorAction(1, { name: "conflict" });

            const store = $s.Store();
            const commitSpy = jest.spyOn(store, "commit");
            const action = sm.actions[ActionTypes.STATION_PORTAL_ERROR];
            const state = store.state.stations;

            expect(store.state.stations.all[0].portalId).toBeNull();

            await action({ commit: store.commit, state: state }, payload);

            expect(commitSpy.mock.calls.length).toBe(1);

            expect(store.state.stations.all[0].portalId).toBe(null);

            await action({ commit: store.commit, state: state }, payload);

            expect(commitSpy.mock.calls.length).toBe(1);

            expect(store.state.stations.all[0].portalId).toBe(null);
        });
    });
});
