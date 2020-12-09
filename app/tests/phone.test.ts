import _ from "lodash";
import { describe, expect, it } from "@jest/globals";
import { Services, OurStore, ServicesImpl } from "@/services";
import { MutationTypes, Station, RenameStationMutation, PhoneNetwork } from "@/store";
import { createStation } from "./utilities";

describe("store - phone", () => {
    describe("directlyConnected", () => {
        let services: Services;
        let store: OurStore;

        beforeEach(async () => {
            services = new ServicesImpl();
            await services.CreateDb().initialize(null, false, false);
            store = services.Store();
        });

        it("should compare phone ssid to known station names", () => {
            expect.assertions(2);

            store.commit(MutationTypes.PHONE_NETWORK, new PhoneNetwork("home-wifi"));
            const stations = [new Station(createStation(1, "station-1")), new Station(createStation(2, "station-2"))];
            store.commit(MutationTypes.STATIONS, stations);

            expect(store.getters.directlyConnected).toBe(false);

            store.commit(MutationTypes.PHONE_NETWORK, new PhoneNetwork("station-1"));

            expect(store.getters.directlyConnected).toBe(true);
        });

        it("should compare phone ssid to known station names, including renames", () => {
            expect.assertions(3);

            const stations = [new Station(createStation(1, "station-1")), new Station(createStation(2, "station-2"))];
            store.commit(MutationTypes.STATIONS, stations);

            expect(store.getters.directlyConnected).toBe(false);

            store.commit(MutationTypes.PHONE_NETWORK, new PhoneNetwork("station-2"));

            store.commit(new RenameStationMutation(stations[0].deviceId, "statation-renamed"));

            expect(store.getters.directlyConnected).toBe(true);

            store.commit(MutationTypes.PHONE_NETWORK, new PhoneNetwork("statation-renamed"));

            expect(store.getters.directlyConnected).toBe(true);
        });
    });
});
