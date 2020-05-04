import Promise from "bluebird";
import { Services } from "../services/services";
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
        console.log("BEFORE", stations[0]);
        const db = await dbInterface.getDatabase();

        {
            const done = await db.query("UPDATE stations SET name = ? WHERE id = ?");
            const after = await dbInterface.getAll();
            console.log("AFTER", after[0]);
        }

        {
            const done = await db.query("UPDATE stations SET name = ? WHERE id = ?", "Some Name", stations[0].id);
            const after = await dbInterface.getAll();
            console.log("AFTER", after[0]);
        }

        {
            const done = await db.execute("UPDATE stations SET name = ? WHERE id = ?", "Some Name", stations[0].id);
            const after = await dbInterface.getAll();
            console.log("AFTER", after[0]);
        }
    });

    test("updateStationStatus should succeed", async () => {
        const data = await dbInterface.updateStationStatus(
            { id: 1, deviceId: "device-id" },
            {
                streams: [
                    { size: 0, block: 0, type: "meta" },
                    { size: 0, block: 0, type: "data" },
                ],
                provisions: [],
            }
        );
    });

    test("getAll should get all stations", async () => {
        const data = await dbInterface.getAll();
        expect(data.length).toEqual(5);
    });

    test("getStation should get one station", async () => {
        const data = await dbInterface.getStation(1);
        expect(data.length).toEqual(1);
    });

    test("getSensors should get sensors", async () => {
        const m = await dbInterface.getModules(1);
        const data = await dbInterface.getSensors(m[0].id);
        expect(data.length).toBeGreaterThan(0);
    });

    test("getModule should get one module", async () => {
        const data = await dbInterface.getModule(1);
        expect(data.length).toEqual(1);
    });

    test("getModules should get modules", async () => {
        const stationId = 1;
        const data = await dbInterface.getModules(1);
        expect(data.length).toBeGreaterThan(0);
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

    test("setStationInterval should set a station's interval", async () => {
        const data = await dbInterface.getStation(1);
        const newInterval = 12345678;
        data[0].interval = newInterval;
        const change = await dbInterface.setStationInterval(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].interval).toEqual(newInterval);
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

    test("setStationDeployStartTime should set a station's deployment start time", async () => {
        const data = await dbInterface.getStation(1);
        const startTime = Date.now();
        data[0].deployStartTime = startTime;
        const change = await dbInterface.setStationDeployStartTime(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].deployStartTime).toEqual(startTime);
    });

    test("updateStation should update station fields", async () => {
        const data = await dbInterface.getStation(1);
        const stationParams = {
            generationId: "5",
            name: "Magnolia",
            url: "http://12.34.56",
            portalId: 1,
            status: "recording",
            deployStartTime: Date.now(),
            locationName: "Corner",
            studyObjective: "This is the objective.",
            locationPurpose: "This is the location purpose.",
            siteCriteria: "This is the site criteria.",
            siteDescription: "Site description.",
            percentComplete: 100,
            batteryLevel: 67,
            consumedMemory: 432,
            totalMemory: 3425,
            consumedMemoryPercent: 13,
            interval: 1345435,
            statusJson: { note: "All the various details about the station" },
            longitude: -122.01,
            latitude: 45.62,
            serialized: "2342ur982uru2",
        };
        data[0].generationId = stationParams.generationId;
        data[0].name = stationParams.name;
        data[0].url = stationParams.url;
        data[0].portalId = stationParams.portalId;
        data[0].status = stationParams.status;
        data[0].deployStartTime = stationParams.deployStartTime;
        data[0].locationName = stationParams.locationName;
        data[0].studyObjective = stationParams.studyObjective;
        data[0].locationPurpose = stationParams.locationPurpose;
        data[0].siteCriteria = stationParams.siteCriteria;
        data[0].siteDescription = stationParams.siteDescription;
        data[0].percentComplete = stationParams.percentComplete;
        data[0].batteryLevel = stationParams.batteryLevel;
        data[0].consumedMemory = stationParams.consumedMemory;
        data[0].totalMemory = stationParams.totalMemory;
        data[0].consumedMemoryPercent = stationParams.consumedMemoryPercent;
        data[0].interval = stationParams.interval;
        data[0].statusJson = stationParams.statusJson;
        data[0].longitude = stationParams.longitude;
        data[0].latitude = stationParams.latitude;
        data[0].serialized = stationParams.serialized;
        const change = await dbInterface.updateStation(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].generationId).toEqual(stationParams.generationId);
        expect(newData[0].name).toEqual(stationParams.name);
        expect(newData[0].url).toEqual(stationParams.url);
        expect(newData[0].portalId).toEqual(stationParams.portalId);
        expect(newData[0].status).toEqual(stationParams.status);
        expect(newData[0].deployStartTime).toEqual(stationParams.deployStartTime);
        expect(newData[0].locationName).toEqual(stationParams.locationName);
        expect(newData[0].studyObjective).toEqual(stationParams.studyObjective);
        expect(newData[0].locationPurpose).toEqual(stationParams.locationPurpose);
        expect(newData[0].siteCriteria).toEqual(stationParams.siteCriteria);
        expect(newData[0].siteDescription).toEqual(stationParams.siteDescription);
        expect(newData[0].percentComplete).toEqual(stationParams.percentComplete);
        expect(newData[0].batteryLevel).toEqual(stationParams.batteryLevel);
        expect(newData[0].consumedMemory).toEqual(stationParams.consumedMemory);
        expect(newData[0].totalMemory).toEqual(stationParams.totalMemory);
        expect(newData[0].consumedMemoryPercent).toEqual(stationParams.consumedMemoryPercent);
        expect(newData[0].interval).toEqual(stationParams.interval);
        expect(JSON.parse(newData[0].statusJson)).toEqual(stationParams.statusJson);
        expect(newData[0].longitude).toEqual(stationParams.longitude);
        expect(newData[0].latitude).toEqual(stationParams.latitude);
        expect(newData[0].serializedStatus).toEqual(stationParams.serialized);
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

    test("setModuleName should set a module's name", async () => {
        const data = await dbInterface.getModule(1);
        const newName = "Clackamas Water Quality";
        data[0].name = newName;
        const change = await dbInterface.setModuleName(data[0]);
        const newData = await dbInterface.getModule(1);
        expect(newData[0].name).toEqual(newName);
    });

    test("setModuleInterval should set a module's interval", async () => {
        const data = await dbInterface.getModule(1);
        const newInterval = 87654321;
        data[0].interval = newInterval;
        const change = await dbInterface.setModuleInterval(data[0]);
        const newData = await dbInterface.getModule(1);
        expect(newData[0].interval).toEqual(newInterval);
    });

    test("setModulePosition should set a module's position", async () => {
        const data = await dbInterface.getModule(1);
        const position = 1;
        data[0].position = position;
        const change = await dbInterface.setModulePosition(data[0]);
        const newData = await dbInterface.getModule(1);
        expect(newData[0].position).toEqual(position);
    });

    test("setModuleGraphs should set a module's graphs", async () => {
        const data = await dbInterface.getModule(1);
        const graphs = "seeded-device-0-module-1-sensor-1";
        data[0].graphs = graphs;
        const change = await dbInterface.setModuleGraphs(data[0]);
        const newData = await dbInterface.getModule(1);
        expect(newData[0].graphs).toEqual(graphs);
    });

    test("recordModuleConfigChange should record a module configuration change", async () => {
        const configChange = {
            moduleId: 1,
            before: "Water Module 2",
            after: "Indian Ocean Module",
            affectedField: "name",
            author: "tester",
        };
        const change = await dbInterface.recordModuleConfigChange(configChange);
        const newData = await dbInterface.getModuleConfigs(1);
        const lastIndex = newData.length - 1;
        expect(newData[lastIndex].after).toEqual(configChange.after);
    });
});
