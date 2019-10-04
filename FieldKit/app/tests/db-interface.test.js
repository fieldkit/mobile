import Services from '../services/services';

const dbInterface = Services.Database();
const createDB = Services.CreateDb();

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
        const data = await dbInterface.getStation(1);
        expect(data.length).toEqual(1);
    });

    test("getSensors should get sensors", async () => {
        const data = await dbInterface.getSensors(1);
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

    test("setStationPortalID should set a station's portal id", async () => {
        const data = await dbInterface.getStation(1);
        const portalId = 28;
        data[0].portalId = portalId;
        const change = await dbInterface.setStationPortalID(data[0]);
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

    test("setStationDeployImage should set a station's deployment image", async () => {
        const data = await dbInterface.getStation(1);
        const imageName = "toadstools_and_waterfall.jpg";
        data[0].deployImageName = imageName;
        const change = await dbInterface.setStationDeployImage(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].deployImageName).toEqual(imageName);
    });

    test("setStationDeployImageLabel should set a station's deployment image label", async () => {
        const data = await dbInterface.getStation(1);
        const imageLabel = "We left the station next to the toadstools.";
        data[0].deployImageLabel = imageLabel;
        const change = await dbInterface.setStationDeployImageLabel(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].deployImageLabel).toEqual(imageLabel);
    });

    test("setStationDeployNote should set a station's deployment note", async () => {
        const data = await dbInterface.getStation(1);
        const note =
            "If you can't find the station, check the hollow in the fir to the left of the waterfall.";
        data[0].deployNote = note;
        const change = await dbInterface.setStationDeployNote(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].deployNote).toEqual(note);
    });

    test("setStationDeployAudio should set a station's deployment audio file", async () => {
        const data = await dbInterface.getStation(1);
        const audioFiles = "Audio recording Jul 24 2019.m4a,Audio recording Jul 24 2019 2.m4a";
        data[0].deployAudioFiles = audioFiles;
        const change = await dbInterface.setStationDeployAudio(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].deployAudioFiles).toEqual(audioFiles);
    });

    test("setStationDeployStartTime should set a station's deployment start time", async () => {
        const data = await dbInterface.getStation(1);
        const startTime = Date.now();
        data[0].deployStartTime = startTime;
        const change = await dbInterface.setStationDeployStartTime(data[0]);
        const newData = await dbInterface.getStation(1);
        expect(newData[0].deployStartTime).toEqual(startTime);
    });

    test("recordStationConfigChange should record a station configuration change", async () => {
        const configChange = {
            stationId: 1,
            before: "Ye Olde Name",
            after: "Shiny New Name",
            affectedField: "name",
            author: "tester"
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
            author: "tester"
        };
        const change = await dbInterface.recordModuleConfigChange(configChange);
        const newData = await dbInterface.getModuleConfigs(1);
        const lastIndex = newData.length - 1;
        expect(newData[lastIndex].after).toEqual(configChange.after);
    });
});
