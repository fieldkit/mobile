import Promise from "bluebird";
import { Services } from "../services/services";
import { randomHexString } from "./utilities";
import Fixtures from "./fixtures.js";

describe("DatabaseInterface", () => {
    let services;
    let dbInterface;

    beforeAll(async () => {
        services = new Services();
        dbInterface = services.Database();
        const db = await services.CreateDb().initialize();
        const fixtures = new Fixtures(dbInterface);
        const added = await fixtures.addStationsAndModules();
    });

    test("getDatabase should create and return a new database", () => {
        return expect(dbInterface.getDatabase()).resolves.toBeDefined();
    });

    test("testing weird query issue", async () => {
        const stations = await dbInterface.getAll();
        const db = await dbInterface.getDatabase();

        {
            const done = await db.query("UPDATE stations SET name = ? WHERE id = ?");
            const after = await dbInterface.getAll();
        }

        {
            const done = await db.query("UPDATE stations SET name = ? WHERE id = ?", "Some Name", stations[0].id);
            const after = await dbInterface.getAll();
        }

        {
            const done = await db.execute("UPDATE stations SET name = ? WHERE id = ?", "Some Name", stations[0].id);
            const after = await dbInterface.getAll();
        }
    });

    test("getAll should get all stations", async () => {
        const data = await dbInterface.getAll();
        expect(data.length).toEqual(5);
    });

    test("getStation should get one station", async () => {
        const data = await dbInterface.getStation(1);
        expect(data.length).toEqual(1);
    });

    test("setStationName should set a station's name", async () => {
        const data = await dbInterface.getStation(1);
        const newName = "Professor Childermass's Station";
        data[0].name = newName;
        const change = await dbInterface.setStationName(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].name).toEqual(newName);
    });

    test("setStationPortalId should set a station's portal id", async () => {
        const data = await dbInterface.getStation(1);
        const portalId = 28;
        data[0].portalId = portalId;
        const change = await dbInterface.setStationPortalId(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].portalId).toEqual(portalId);
    });

    test("setStationLocationCoordinates should set a station's coordinates", async () => {
        const data = await dbInterface.getStation(1);
        const newCoords = [10, -10];
        data[0].latitude = newCoords[0];
        data[0].longitude = newCoords[1];
        const change = await dbInterface.setStationLocationCoordinates(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].latitude).toEqual(newCoords[0]);
        expect(newData[0].longitude).toEqual(newCoords[1]);
    });

    test("setStationLocationCoordinates should set a station's coordinates", async () => {
        const data = await dbInterface.getStation(1);
        const newCoords = [10, -10];
        data[0].latitude = newCoords[0];
        data[0].longitude = newCoords[1];
        const change = await dbInterface.setStationLocationCoordinates(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].latitude).toEqual(newCoords[0]);
        expect(newData[0].longitude).toEqual(newCoords[1]);
    });

    test("setStationLocationName should set a station's location name", async () => {
        const data = await dbInterface.getStation(1);
        const newLocationName = "Alvord Desert";
        data[0].locationName = newLocationName;
        const change = await dbInterface.setStationLocationName(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].locationName).toEqual(newLocationName);
    });

    test("setStationStudyObjective should set a station's study objective", async () => {
        const data = await dbInterface.getStation(1);
        const objective = "This study will help us understand water quality.";
        data[0].studyObjective = objective;
        const change = await dbInterface.setStationStudyObjective(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].studyObjective).toEqual(objective);
    });

    test("setStationLocationPurpose should set a station's location purpose", async () => {
        const data = await dbInterface.getStation(1);
        const purpose = "The purpose of this location is to monitor our pond.";
        data[0].locationPurpose = purpose;
        const change = await dbInterface.setStationLocationPurpose(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].locationPurpose).toEqual(purpose);
    });

    test("setStationSiteCriteria should set a station's site criteria", async () => {
        const data = await dbInterface.getStation(1);
        const criteria = "We wanted the site to be as far away from shore as possible.";
        data[0].siteCriteria = criteria;
        const change = await dbInterface.setStationSiteCriteria(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].siteCriteria).toEqual(criteria);
    });

    test("setStationSiteDescription should set a station's site description", async () => {
        const data = await dbInterface.getStation(1);
        const description = "The station is tied to the dock in the middle of the pond.";
        data[0].siteDescription = description;
        const change = await dbInterface.setStationSiteDescription(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].siteDescription).toEqual(description);
    });

    test("updateStation should update station fields", async () => {
        const data = await dbInterface.getStation(1);
        const stationParams = {
            id: data[0].id,
            generationId: "5",
            deviceId: data[0].deviceId,
            name: "Magnolia",
            url: "http://12.34.56",
            portalId: 1,
            status: "recording",
            deployStartTime: Date.now(),
            batteryLevel: 67,
            consumedMemory: 432,
            totalMemory: 3425,
            consumedMemoryPercent: 13,
            interval: 1345435,
            statusJson: {
                streams: [
                    { size: 1, block: 1 },
                    { size: 1, block: 1 },
                ],
            },
            longitude: -122.01,
            latitude: 45.62,
            serializedStatus: "2342ur982uru2",
        };
        const change = await dbInterface._updateStation(stationParams);
        const newData = await dbInterface.getStation(1);
        expect(newData[0]).toEqual(expect.objectContaining(stationParams));
    });

    test("insertFieldNote should insert a field note", async () => {
        const fieldNote = {
            stationId: 1,
            note: "One new note",
            category: "default",
            audioFile: "",
            author: "Test User",
        };
        const change = await dbInterface.insertFieldNote(fieldNote);
        const newData = await dbInterface.getFieldNotes(1);
        const lastIndex = newData.length - 1;
        expect(newData[lastIndex].note).toEqual(fieldNote.note);
    });

    test("getFieldNotes should get field notes", async () => {
        const data = await dbInterface.getFieldNotes(1);
        expect(data.length).toBeGreaterThan(0);
    });

    test("removeFieldNote should remove a field note", async () => {
        const data = await dbInterface.getFieldNotes(1);
        const removed = await dbInterface.removeFieldNote(data[0].id);
        const newData = await dbInterface.getFieldNotes(1);
        expect(newData.length).toBe(data.length - 1);
    });

    test("insertFieldMedia should insert a field media", async () => {
        const fieldMedia = {
            stationId: 1,
            imageName: "",
            imageLabel: "Toadstools and waterfall",
            category: "image",
            author: "Test User",
        };
        const change = await dbInterface.insertFieldMedia(fieldMedia);
        const newData = await dbInterface.getFieldMedia(1);
        const lastIndex = newData.length - 1;
        expect(newData[lastIndex].imageLabel).toEqual(fieldMedia.imageLabel);
    });

    test("getFieldMedia should get field media", async () => {
        const data = await dbInterface.getFieldMedia(1);
        expect(data.length).toBeGreaterThan(0);
    });

    test("removeFieldMedia should remove a field media", async () => {
        const data = await dbInterface.getFieldMedia(1);
        const removed = await dbInterface.removeFieldMedia(data[0].id);
        const newData = await dbInterface.getFieldMedia(1);
        expect(newData.length).toBe(data.length - 1);
    });

    test("recordStationConfigChange should record a station configuration change", async () => {
        const configChange = {
            stationId: 1,
            before: "Ye Olde Name",
            after: "Shiny New Name",
            affectedField: "name",
            author: "tester",
        };
        const change = await dbInterface.recordStationConfigChange(configChange);
        const newData = await dbInterface.getStationConfigs(1);
        const lastIndex = newData.length - 1;
        expect(newData[lastIndex].before).toEqual(configChange.before);
    });
});
