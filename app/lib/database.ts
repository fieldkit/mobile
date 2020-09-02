import _ from "lodash";
import Sqlite from "@/wrappers/sqlite";
import { Readings } from "./readings";
import { Task } from "./tasks";

export class Sensor {
    constructor(public readonly id: number, public readonly key: string) {}
}

export class ReadingsDatabase {
    private sensors: { [index: string]: Sensor } = {};

    constructor(private readonly db: any) {}

    public static async open(name: string): Promise<ReadingsDatabase> {
        return await new Sqlite()
            .open(name)
            .then((db) => {
                db.query(`PRAGMA foreign_keys = ON;`);
                return new ReadingsDatabase(db);
            })
            .then((db) => db.create());
    }

    public async create() {
        await this.db.batch([
            `CREATE TABLE IF NOT EXISTS sensors (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				key TEXT NOT NULL
			)`,
            `CREATE TABLE IF NOT EXISTS readings (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				device_id TEXT NOT NULL,
				time DATETIME NOT NULL,
				sensor_id INTEGER NOT NULL,
				value NUMERIC NOT NULL
			)`,
            `CREATE UNIQUE INDEX IF NOT EXISTS readings_idx ON readings (device_id, time, sensor_id)`,
        ]);

        await this.refreshSensors();

        return this;
    }

    private async refreshSensors(): Promise<{ [index: string]: Sensor }> {
        const rows = await this.db.query(`SELECT * FROM sensors ORDER BY key`);
        this.sensors = _.keyBy(
            rows.map((r) => new Sensor(r.id, r.key)),
            (s) => s.key
        );
        return this.sensors;
    }

    public async findSensor(key: string): Promise<Sensor> {
        if (this.sensors[key]) {
            return Promise.resolve(this.sensors[key]);
        }

        await this.db.query(`INSERT INTO sensors (key) VALUES (?)`, [key]);

        await this.refreshSensors();

        if (!this.sensors[key]) {
            console.log(`error finding sensor: ${key}`);
            throw new Error(`error finding sensor: ${key}`);
        }

        return Promise.resolve(this.sensors[key]);
    }
}

const name = ":memory:"; // "cache/fkdata.sqlite3"
const readingsDbPromise = ReadingsDatabase.open(name);

export class SaveReadingsTask extends Task {
    public readonly taskName = "SaveReadingsTask";

    constructor(public readonly readings: Readings[]) {
        super();
    }

    public run(): Promise<any> {
        return readingsDbPromise
            .then((readingsDb) => {
                const sensorKeys = _.uniq(_.flatten(this.readings.map((r) => Object.keys(r.readings))));
                return Promise.all(sensorKeys.map((key) => readingsDb.findSensor(key))).then((sensors) => {});
            })
            .catch((error) => {
                console.log(`error: ${error}`);
            });
    }
}
