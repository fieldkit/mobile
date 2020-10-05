import { ServicesImpl } from "../services/services";
import { MockStationReplies } from "./utilities";
import Fixtures from "./fixtures.js";

describe("QueryStation", () => {
    const url = "http://192.168.0.1";
    let services;
    let queryStation;
    let mockStation;
    let dbInterface;

    beforeEach(async () => {
        services = new ServicesImpl();
        dbInterface = services.Database();
        queryStation = services.QueryStation();
        mockStation = new MockStationReplies(services);
        const db = await services.CreateDb().initialize();
        const fixtures = new Fixtures(dbInterface);
    });

    it("should retrieve a station status", () => {
        expect.assertions(2);

        mockStation.queueBody({
            errors: [],
            type: 15,
            status: {},
            modules: [
                {
                    sensors: [[{}], [{}], [{}], [{}]],
                    name: "Water Quality Module",
                },
            ],
        });

        return queryStation.getStatus(url).then((body) => {
            expect(body.liveReadings).toBeDefined();
            expect(mockStation.mock.calls.length).toBe(1);
        });
    });

    it("should retrieve station readings (body)", () => {
        // Must match expect calls below, ensures that we don't get
        // false positives when the promise never resolve and the
        // expect calls are never reached.
        expect.assertions(2);

        mockStation.queueBody({
            errors: [],
            type: 18,
            modules: [],
            streams: [],
            liveReadings: [{ modules: [{ module: {} }], time: 1565734980 }],
        });

        return queryStation.takeReadings(url).then((body) => {
            expect(body.liveReadings).toBeDefined();
            expect(mockStation.mock.calls.length).toBe(1);
        });
    });

    it("should retrieve station readings (response)", () => {
        // Must match expect calls below, ensures that we don't get
        // false positives when the promise never resolve and the
        // expect calls are never reached.
        expect.assertions(2);

        mockStation.queueResponse({
            body: {
                errors: [],
                type: 18,
                modules: [],
                streams: [],
                liveReadings: [{ modules: [{ module: {} }], time: 1565734980 }],
            },
        });

        return queryStation.takeReadings(url).then((body) => {
            expect(body.liveReadings).toBeDefined();
            expect(mockStation.mock.calls.length).toBe(1);
        });
    });
});
