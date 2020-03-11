import Services from "../services/services";
import { MockStationReplies } from "./utilities";

describe("QueryStation", () => {
    let queryStation;
    let mockStation;

    beforeEach(() => {
        queryStation = Services.QueryStation();
        mockStation = new MockStationReplies(Services);
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

        return queryStation.getStatus().then(body => {
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
            liveReadings: [{ modules: [{}], time: 1565734980 }],
        });

        return queryStation.takeReadings().then(body => {
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
                liveReadings: [{ modules: [{}], time: 1565734980 }],
            },
        });

        return queryStation.takeReadings().then(body => {
            expect(body.liveReadings).toBeDefined();
            expect(mockStation.mock.calls.length).toBe(1);
        });
    });
});
