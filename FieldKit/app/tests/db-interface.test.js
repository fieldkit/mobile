import CreateDB from "../services/create-db";
import DatabaseInterface from "../services/db-interface";
const dbInterface = new DatabaseInterface();
const createDB = new CreateDB();

describe("DatabaseInterface", () => {
    beforeAll(async done => {
        await createDB.initialize();
        done();
    });

    test("getDatabase should create and return a new database", () => {
        return expect(dbInterface.getDatabase()).resolves.toBeDefined();
    });

    test("getAll should get all stations", async () => {
        const data = await dbInterface.getAll();
        expect(data.length).toEqual(5);
    });

    test("getStation should get one station", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        expect(data.length).toEqual(1);
    });

    test("getSensors should get sensors", async () => {
        const sensor = createDB.getSeededSensors()[0];
        const data = await dbInterface.getSensors(sensor.moduleId);
        expect(data.length).toBeGreaterThan(0);
    });

    test("getModule should get one module", async () => {
        const module = createDB.getSeededModules()[0];
        const data = await dbInterface.getModule(module.moduleId);
        expect(data.length).toEqual(1);
    });

    test("getModules should get modules", async () => {
        const module = createDB.getSeededModules()[0];
        const data = await dbInterface.getModules(module.deviceId);
        expect(data.length).toBeGreaterThan(0);
    });

    test("setStationName should set a station's name", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const newName = "Professor Childermass's Station";
        data[0].name = newName;
        const change = await dbInterface.setStationName(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].name).toEqual(newName);
    });

    test("setStationLocationCoordinates should set a station's coordinates", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const newCoords = [10, -10];
        data[0].latitude = newCoords[0];
        data[0].longitude = newCoords[1];
        const change = await dbInterface.setStationLocationCoordinates(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].latitude).toEqual(newCoords[0]);
        expect(newData[0].longitude).toEqual(newCoords[1]);
    });

    test("setStationLocationCoordinates should set a station's coordinates", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const newCoords = [10, -10];
        data[0].latitude = newCoords[0];
        data[0].longitude = newCoords[1];
        const change = await dbInterface.setStationLocationCoordinates(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].latitude).toEqual(newCoords[0]);
        expect(newData[0].longitude).toEqual(newCoords[1]);
    });

    test("setStationLocationName should set a station's location name", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const newLocationName = "Alvord Desert";
        data[0].location_name = newLocationName;
        const change = await dbInterface.setStationLocationName(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].location_name).toEqual(newLocationName);
    });

    test("setStationInterval should set a station's interval", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const newInterval = 12345678;
        data[0].interval = newInterval;
        const change = await dbInterface.setStationInterval(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].interval).toEqual(newInterval);
    });

    test("setStationDeployImage should set a station's deployment image", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const imageName = "toadstools_and_waterfall.jpg";
        data[0].deploy_image_name = imageName;
        const change = await dbInterface.setStationDeployImage(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].deploy_image_name).toEqual(imageName);
    });

    test("setStationDeployImageLabel should set a station's deployment image label", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const imageLabel = "We left the station next to the toadstools.";
        data[0].deploy_image_label = imageLabel;
        const change = await dbInterface.setStationDeployImageLabel(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].deploy_image_label).toEqual(imageLabel);
    });

    test("setStationDeployNote should set a station's deployment note", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const note =
            "If you can't find the station, check the hollow in the fir to the left of the waterfall.";
        data[0].deploy_note = note;
        const change = await dbInterface.setStationDeployNote(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].deploy_note).toEqual(note);
    });

    test("setStationDeployAudio should set a station's deployment audio file", async () => {
        const station = createDB.getSeededStations()[0];
        const data = await dbInterface.getStation(station.deviceId);
        const audioFiles =
            "Audio recording Jul 24 2019.m4a,Audio recording Jul 24 2019 2.m4a";
        data[0].deploy_audio_files = audioFiles;
        const change = await dbInterface.setStationDeployAudio(data[0]);
        const newData = await dbInterface.getStation(station.deviceId);
        expect(newData[0].deploy_audio_files).toEqual(audioFiles);
    });

    test("recordStationConfigChange should record a station configuration change", async () => {
        const station = createDB.getSeededStations()[0];
        const configChange = {
            device_id: station.deviceId,
            before: "Ye Olde Name",
            after: "Shiny New Name",
            affected_field: "name",
            author: "tester"
        };
        const change = await dbInterface.recordStationConfigChange(
            configChange
        );
        const newData = await dbInterface.getStationConfigs(station.deviceId);
        const lastIndex = newData.length - 1;
        expect(newData[lastIndex].before).toEqual(configChange.before);
    });

    test("setModuleName should set a module's name", async () => {
        const module = createDB.getSeededModules()[0];
        const data = await dbInterface.getModule(module.moduleId);
        const newName = "Clackamas Water Quality";
        data[0].name = newName;
        const change = await dbInterface.setModuleName(data[0]);
        const newData = await dbInterface.getModule(module.moduleId);
        expect(newData[0].name).toEqual(newName);
    });

    test("setModuleInterval should set a module's interval", async () => {
        const module = createDB.getSeededModules()[0];
        const data = await dbInterface.getModule(module.moduleId);
        const newInterval = 87654321;
        data[0].interval = newInterval;
        const change = await dbInterface.setModuleInterval(data[0]);
        const newData = await dbInterface.getModule(module.moduleId);
        expect(newData[0].interval).toEqual(newInterval);
    });

    test("setModuleGraphs should set a module's graphs", async () => {
        const module = createDB.getSeededModules()[0];
        const data = await dbInterface.getModule(module.moduleId);
        const graphs = "seeded-device-0-module-1-sensor-1";
        data[0].graphs = graphs;
        const change = await dbInterface.setModuleGraphs(data[0]);
        const newData = await dbInterface.getModule(module.moduleId);
        expect(newData[0].graphs).toEqual(graphs);
    });

    test("recordModuleConfigChange should record a module configuration change", async () => {
        const module = createDB.getSeededModules()[0];
        const configChange = {
            module_id: module.moduleId,
            before: "Water Module 2",
            after: "Indian Ocean Module",
            affected_field: "name",
            author: "tester"
        };
        const change = await dbInterface.recordModuleConfigChange(configChange);
        const newData = await dbInterface.getModuleConfigs(module.moduleId);
        const lastIndex = newData.length - 1;
        expect(newData[lastIndex].after).toEqual(configChange.after);
    });
});
