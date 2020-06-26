import _ from "lodash";
import FakeTimers from "@sinonjs/fake-timers";
import { describe, expect, it } from "@jest/globals";
import { Services } from "../services/services";
import { MockStationReplies } from "./utilities";
import * as ActionTypes from "../store/actions";
import * as MutationTypes from "../store/mutations";

describe("database checks", () => {
    let services;
    let mockStation;
    let store;
    let clock;

    beforeEach(async () => {
        clock = FakeTimers.install({ shouldAdvanceTime: true, advanceTimeDelta: 40 });
        clock.tick(10);

        services = new Services();
        mockStation = new MockStationReplies(services);
        await services.CreateDb().initialize(false /*, "shah.db"*/);
        store = services.Store();

        store.commit(MutationTypes.SERVICES, () => services);

        if (false) {
            console.log(mockStation);
        }
    });

    afterEach(() => {});

    describe("stations, loading", () => {
        it("should load stations", async () => {
            expect.assertions(1);
            return store.dispatch(ActionTypes.LOAD).then(() => {
                expect(true).toBe(true);
            });
        });

        it("should load stations and refresh state", async () => {
            expect.assertions(1);
            return store
                .dispatch(ActionTypes.LOAD)
                .then(() => {
                    console.log(store.state.stations.all);
                    return services.StateManager().refresh();
                })
                .then(() => {
                    expect(true).toBe(true);
                });
        });
    });
});
