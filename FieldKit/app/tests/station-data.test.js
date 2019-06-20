import StationData from "services/station-data";

describe("StationData", () => {
    let stationData;

    beforeAll(() => {
        stationData = new StationData();
    });

    test("getDatabase should create and return a new database", () => {
        return expect(stationData.getDatabase()).resolves.toBeDefined();
    });

    test("getAll should get all stations", async () => {
        const data = await stationData.getAll();
        expect(data).toHaveLength(5);
    });
});
