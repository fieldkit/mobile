import _ from "lodash";
import FakeTimers from "@sinonjs/fake-timers";
import { describe, expect, it } from "@jest/globals";
import { ServicesImpl } from "@/services";
import { StationRepliedAction } from "@/store";
import { MockStationReplies } from "./utilities";

describe("Stations", () => {
    let services;
    let mockStation;
    let store;
    let clock;
    let db;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 40 });
        clock.tick(10);

        services = new ServicesImpl();
        await services.CreateDb().initialize();
        store = services.Store();
        db = services.Database();
        mockStation = new MockStationReplies(services);
    });

    afterEach(() => {});

    it("loading station with invalid serialized status", async () => {
        expect.assertions(1);

        const fake = [mockStation.newFakeStation(), mockStation.newFakeStation()];
        await store.dispatch(new StationRepliedAction(mockStation.newFakeStatusReply(fake[0]), "http://10.0.0.1/fk/v1"));

        const badReply = mockStation.newFakeStatusReply(fake[1]);
        badReply.serialized = "";
        await store.dispatch(new StationRepliedAction(badReply, "http://10.0.0.2/fk/v1"));

        expect(Object.keys(store.state.firmware.stations).length).toBe(1);
    });

    describe("module moves stations", () => {
        it("loading station with another station's modules", async () => {
            expect.assertions(5);

            const fake1 = mockStation.newFakeStation();
            await store.dispatch(new StationRepliedAction(mockStation.newFakeStatusReply(fake1), "http://10.0.0.1/fk/v1"));
            const ids = Object.keys(store.state.firmware.stations);
            expect(ids.length).toBe(1);
            const firstId = ids[0];

            const modulesBefore = await db.getModuleAll();
            expect(modulesBefore.length).toBe(4);

            const fake2 = mockStation.newFakeStation();
            fake2.moduleIds = [fake1.moduleIds[0]];

            await store.dispatch(new StationRepliedAction(mockStation.newFakeStatusReply(fake2), "http://10.0.0.1/fk/v1"));
            expect(Object.keys(store.state.firmware.stations).length).toBe(2);

            const modulesAfter = await db.getModuleAll();
            expect(modulesAfter.length).toBe(4);

            expect(modulesAfter.filter((m) => m.stationId != firstId).length).toBe(1);
        });

        it("loading remove modules that disappear", async () => {
            expect.assertions(4);

            const fake1 = mockStation.newFakeStation();
            await store.dispatch(new StationRepliedAction(mockStation.newFakeStatusReply(fake1), "http://10.0.0.1/fk/v1"));
            expect(Object.keys(store.state.firmware.stations).length).toBe(1);

            const modulesBefore = await db.getModuleAll();
            expect(modulesBefore.length).toBe(4);

            fake1.moduleIds = [fake1.moduleIds[0], fake1.moduleIds[1], fake1.moduleIds[2]];

            await store.dispatch(new StationRepliedAction(mockStation.newFakeStatusReply(fake1), "http://10.0.0.1/fk/v1"));
            expect(Object.keys(store.state.firmware.stations).length).toBe(1);

            const modulesAfter = await db.getModuleAll();
            expect(modulesAfter.length).toBe(3);
        });
    });
});
