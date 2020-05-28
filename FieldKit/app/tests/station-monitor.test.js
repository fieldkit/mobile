import _ from "lodash";
import Promise from "bluebird";
import { Services } from "../services/services";
import { MockStationReplies } from "./utilities";
import Fixtures from "./fixtures.js";

describe("StationMonitor", () => {
    let services;
    let stationMonitor;
    let mockStation;
    let db;

    beforeAll(async () => {
        services = new Services();
        await services.CreateDb().initialize();
        db = services.Database();
        stationMonitor = services.StationMonitor();
        mockStation = new MockStationReplies(services);
    });

    test("discovered new station, adds the station", async () => {
        const station = mockStation.newFakeStation();
        mockStation.queueStatusReply(station);
        // NOTE: We need to remove this second query, leaving for now.
        mockStation.queueStatusReply(station);

        expect.assertions(2);

        await services.DiscoverStation().onFoundService({
            type: "_fk._tcp",
            name: station.deviceId,
            host: "192.168.1.2",
            port: 80,
        });

        const stations = await db.getAll();
        expect(
            _(stations)
                .filter(s => s.deviceId == station.deviceId)
                .size()
        ).toEqual(1);

        const modules = await db.getModules(stations[0].id);
        expect(_(modules).size()).toEqual(1);
    });

    /*
    test("rediscovering station", () => {
        return Promise.all(services.DiscoverStation().onFoundService({
            type: "_fk._tcp",
            name: "deadbeefdeadbeefdeadbeef",
            host: "192.168.1.2",
            port: 80,
        }));
    });
*/
});
