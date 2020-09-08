import _ from "lodash";
import Sqlite from "@/wrappers/sqlite";
import { sqliteToJs, serializePromiseChain } from "@/utilities";
import { Readings } from "./readings";
import { DataServices, Task, TaskQueuer } from "./tasks";

export class DataQueryParams {
    constructor(public readonly start: number, public readonly end: number, public readonly sensorIds: number[]) {}
}

export class Sensor {
    constructor(public readonly id: number, public readonly key: string) {}
}

export interface ReadingRow {
    id: number;
    // deviceId: string;
    // stationId: number;
    time: number;
    sensorId: number;
    value: number;
}

export class ReadingsDatabase {
    private sensors: { [index: string]: Sensor } = {};

    constructor(private readonly db: any) {}

    public static async delete(name: string): Promise<any> {
        const sqlite = new Sqlite();
        await sqlite.delete(name);
        return {};
    }

    public static async open(name: string): Promise<ReadingsDatabase> {
        const sqlite = new Sqlite();
        const db = await sqlite.open(name);
        await db.query(`PRAGMA foreign_keys = ON;`);
        await db.query(`PRAGMA synchronous = OFF;`);
        await db.query(`PRAGMA journal_mode = MEMORY;`);
        const readingsDb = new ReadingsDatabase(db);
        await readingsDb.create();
        return readingsDb;
    }

    public async create() {
        await this.db.batch([
            `CREATE TABLE IF NOT EXISTS sensors (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				key TEXT NOT NULL
			)`,
            `CREATE TABLE IF NOT EXISTS readings (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				time DATETIME NOT NULL,
				sensor_id INTEGER NOT NULL,
				value NUMERIC NOT NULL
			)`,
            // `CREATE UNIQUE INDEX IF NOT EXISTS readings_idx ON readings (device_id, time, sensor_id)`,
        ]);

        await this.refreshSensors();

        return this;
    }

    private get sensorKeys(): string[] {
        return Object.keys(this.sensors);
    }

    private get numberOfSensors(): number {
        return this.sensorKeys.length;
    }

    private async refreshSensors(): Promise<{ [index: string]: Sensor }> {
        const rows = await this.db.query(`SELECT * FROM sensors ORDER BY key`);
        const previousSize = this.numberOfSensors;
        this.sensors = _.keyBy(
            rows.map((r) => new Sensor(r.id, r.key)),
            (s) => s.key
        );
        if (previousSize !== this.numberOfSensors) {
            console.log(`sensors added: ${this.numberOfSensors - previousSize} ${this.sensorKeys}`);
        }
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

    public async status(): Promise<any> {
        const size = await this.db.query(`SELECT COUNT(*) AS number_readings FROM readings`);
        console.log(`status: ${JSON.stringify(size)}`);
        return {};
    }

    public async save(deviceId: string, readings: Readings[]): Promise<any> {
        const sensorKeys = _.uniq(_.flatten(readings.map((r) => Object.keys(r.readings))));
        const sensorPairs = await Promise.all(sensorKeys.map((key) => this.findSensor(key).then((sensor) => [key, sensor])));
        const sensors = _.fromPairs(sensorPairs);
        const started = new Date();

        await this.db.query(`BEGIN TRANSACTION`);

        return serializePromiseChain(readings, (readings: Readings) => {
            return serializePromiseChain(Object.keys(readings.readings), (sensorKey: string) => {
                const sensor = sensors[sensorKey];
                if (!sensor) {
                    throw new Error(`missing sensor: ${sensorKey}`);
                }
                const value = readings.readings[sensorKey];
                const values = [readings.time, sensor.id, value];
                return this.db
                    .query(
                        `
						INSERT INTO readings (time, sensor_id, value)
						VALUES (?, ?, ?)
						`,
                        values
                    )
                    .catch((error) => {
                        console.log(`sql:error: ${error.message} ${values}`);
                        return Promise.reject(error);
                    });
            });
        }).then(() => {
            return this.db.query(`COMMIT TRANSACTION`).then(() => {
                const end = new Date();
                const elapsed = end.getTime() - started.getTime();
                console.log(`save:done elapsed=${elapsed} records=${readings.length}`);
                return this.status();
            });
        });
    }

    public async describe() {
        const times = sqliteToJs(await this.db.query(`SELECT MIN(time) AS start, MAX(time) AS end FROM readings`));
        const sensors = sqliteToJs(
            await this.db.query(
                `SELECT sensor_id, sensors.key, COUNT(*) AS records FROM readings JOIN sensors ON (sensor_id = sensors.id) GROUP BY sensor_id`
            )
        );
        if (times.length != 1) throw new Error(`no times in readings database`);
        return {
            start: times[0].start,
            end: times[0].end,
            sensors: sensors,
        };
    }

    public async query(params: DataQueryParams): Promise<ReadingRow[]> {
        const values = [params.start, params.end, params.sensorIds];
        const rawRows = await this.db.query(`SELECT * FROM readings WHERE (time > ? AND time < ?) AND (sensor_id IN (?))`, values);
        const rows = sqliteToJs(rawRows);
        console.log(rows);
        return [];
    }
}

export class SaveReadingsTask extends Task {
    public readonly taskName = "SaveReadingsTask";

    constructor(public readonly deviceId: string, private readonly purge: boolean, public readonly readings: Readings[]) {
        super();
    }

    private get name(): string {
        return this.deviceId + ".sqlite3";
    }

    public async run(services: DataServices, tasks: TaskQueuer): Promise<any> {
        if (this.purge) {
            console.log("purging database", this.name);
            await ReadingsDatabase.delete(this.name);
        }
        const db = await ReadingsDatabase.open(this.name);
        await db.save(this.deviceId, this.readings);
        const summary = await db.describe();
        console.log("summary", summary);
    }
}
