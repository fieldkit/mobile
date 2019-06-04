import StationStatus from "services/station-status";
const stationStatus = new StationStatus();

describe("StationStatus", () => {

    beforeAll(() => {
        // seed the database
    });

    test("should check for FieldKitStations database", () => {
        expect(stationStatus.checkForDB()).toEqual(true);
    });

    test("should get all stations", () => {
        console.log(stationStatus.getAll());
    });

});
