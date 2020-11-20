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

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 40 });
        clock.tick(10);

        services = new ServicesImpl();
        await services.CreateDb().initialize();
        store = services.Store();
        mockStation = new MockStationReplies(services);

        /*
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
		*/
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
            expect.assertions(2);

            const fake1 = mockStation.newFakeStation();
            await store.dispatch(new StationRepliedAction(mockStation.newFakeStatusReply(fake1), "http://10.0.0.1/fk/v1"));
            expect(Object.keys(store.state.firmware.stations).length).toBe(1);

            const fake2 = mockStation.newFakeStation();
            console.log(fake1.moduleIds);
            console.log(fake2.moduleIds);
            fake2.moduleIds = fake1.moduleIds;
            await store.dispatch(new StationRepliedAction(mockStation.newFakeStatusReply(fake2), "http://10.0.0.1/fk/v1"));
            expect(Object.keys(store.state.firmware.stations).length).toBe(2);
        });
    });
});
