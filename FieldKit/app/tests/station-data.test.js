import StationData from "services/station-data";
const stationData = new StationData();

describe("StationData", () => {

    beforeAll(() => {
        // seed the database
    });

    test("should check for FieldKitStations database", () => {
        expect(stationData.checkForDB()).toEqual(true);
    });

    test("should get all stations", () => {
        console.log(stationData.getAll());
    });

});
