import CreateDB from "services/create-db";
import DatabaseInterface from "services/db-interface";
const dbInterface = new DatabaseInterface();
const createDB = new CreateDB();

describe("DatabaseInterface", () => {
    beforeAll(async (done) => {
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

    test("getSensors should get a sensor", async () => {
        let sensor = createDB.getSeededSensors()[0];
        const data = await dbInterface.getSensors(sensor.moduleId);
        expect(data.length).toBeGreaterThan(0);
    });

    test("getModules should get a module", async () => {
        let module = createDB.getSeededModules()[0];
        const data = await dbInterface.getModules(module.deviceId);
        expect(data.length).toBeGreaterThan(0);
    });

});
