import StationsList from "services/stations-list";
const stationsList = new StationsList();

describe("StationsList", () => {

    beforeAll(() => {
        // seed the database
    });

    test("should check for FieldKitStations database", () => {
        expect(stationsList.checkForDB()).toEqual(true);
    });

    test("should get all stations", () => {
        console.log(stationsList.getAll());
    });

});
