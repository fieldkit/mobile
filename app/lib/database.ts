import _ from "lodash";
import Sqlite from "@/wrappers/sqlite";
import { sqliteToJs, serializePromiseChain } from "@/utilities";
import { Readings } from "./readings";
import { DataServices, Task, TaskQueuer } from "./tasks";

export class DataQueryParams {
    constructor(
        public readonly start: number,
        public readonly end: number,
        public readonly sensorIds: number[],
        public readonly page: number,
        public readonly pageSize: number
    ) {}
}

export interface DataSummary {
    start: number;
    end: number;
    sensors: { id: number; key: string; records: number }[];
}

export class Sensor {
    constructor(public readonly id: number, public readonly key: string) {}
}

interface ReadingRow {
    id: number;
    time: number;
    sensorId: number;
    value: number;
}

interface AggregatedReadingLike {
    aggregate: string;
    time: number;
    sensorKey: string;
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

    public static nameForDevice(deviceId: string): string {
        return deviceId + ".sqlite3";
    }

    public static async forDevice(deviceId: string): Promise<ReadingsDatabase> {
        return ReadingsDatabase.open(ReadingsDatabase.nameForDevice(deviceId));
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

        Aggregate.getAll().forEach(async (aggregate) => {
            const table = "aggregated_" + aggregate.name;
            await this.db.batch([
                `CREATE TABLE IF NOT EXISTS ${table} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					time DATETIME NOT NULL,
					sensor_id INTEGER NOT NULL,
					value NUMERIC NOT NULL
				)`,
                // `CREATE UNIQUE INDEX IF NOT EXISTS readings_idx ON readings (device_id, time, sensor_id)`,
            ]);
        });

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
            console.log(`sensors: ${this.numberOfSensors - previousSize} ${this.sensorKeys}`);
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

    public async saveAggregates(readings: AggregatedReadingLike[]): Promise<any> {
        const sensorKeys = _.uniq(readings.map((r) => r.sensorKey));
        const sensorPairs = await Promise.all(sensorKeys.map((key) => this.findSensor(key).then((sensor) => [key, sensor])));
        const sensors = _.fromPairs(sensorPairs);

        await this.db.query(`BEGIN TRANSACTION`);

        return serializePromiseChain(readings, (reading: AggregatedReadingLike) => {
            const sensor = sensors[reading.sensorKey];
            if (!sensor) {
                throw new Error(`missing sensor: ${reading.sensorKey}`);
            }
            const table = "aggregated_" + reading.aggregate;
            const values = [reading.time, sensor.id, reading.value];
            return this.db
                .query(
                    `
					INSERT INTO ${table} (time, sensor_id, value)
					VALUES (?, ?, ?)
					`,
                    values
                )
                .catch((error) => {
                    console.log(`sql:error: ${error.message} ${values}`);
                    return Promise.reject(error);
                });
        }).then(() => {
            return this.db.query(`COMMIT TRANSACTION`);
        });
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

    public async describe(): Promise<DataSummary> {
        const times = sqliteToJs(await this.db.query(`SELECT MIN(time) AS start, MAX(time) AS end FROM readings`));
        const sensors = sqliteToJs(
            await this.db.query(
                `SELECT sensor_id AS id, sensors.key, COUNT(*) AS records FROM readings JOIN sensors ON (sensor_id = sensors.id) GROUP BY sensor_id`
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
        if (params.sensorIds.length == 0) {
            console.log(`no sensor ids`);
            return [];
        }
        const questions = _.times(params.sensorIds.length, _.constant("?"));
        const values = [params.start, params.end, ...params.sensorIds, params.pageSize, params.page * params.pageSize];
        const rawRows = await this.db.query(
            `SELECT * FROM readings WHERE (time > ? AND time < ?) AND (sensor_id IN (${questions})) ORDER BY time, sensor_id LIMIT ? OFFSET ?`,
            values
        );
        return sqliteToJs(rawRows);
    }
}

export class Aggregate {
    public samples: { [index: string]: number[] } = {};
    public openTime: number = 0;

    constructor(public readonly name: string, public readonly interval: number) {}

    public static getAll(): Aggregate[] {
        return [
            new Aggregate("24h", 60 * 60 * 24),
            new Aggregate("12h", 60 * 60 * 12),
            new Aggregate("1h", 60 * 60),
            new Aggregate("30m", 60 * 30),
            new Aggregate("5m", 60 * 5),
            new Aggregate("1m", 60),
        ];
    }

    public maybeFlush(db: ReadingsDatabase, time: number): AggregatedReadingLike[] {
        const rounded = Math.floor(time / this.interval) * this.interval;
        if (this.openTime == rounded) {
            return [];
        }
        this.openTime = rounded;
        return this.flush(db);
    }

    public push(time: number, sensor: string, value: number): void {
        const rounded = Math.floor(time / this.interval) * this.interval;
        if (this.openTime != rounded) {
            throw new Error(`pushing unopened time: ${rounded} ${this.openTime}`);
        }

        if (!this.samples[sensor]) {
            this.samples[sensor] = [];
        }

        this.samples[sensor].push(value);
    }

    public flush(db: ReadingsDatabase): AggregatedReadingLike[] {
        if (false && Object.keys(this.samples).length > 0) {
            console.log(`flush: ${this.name} ${this.openTime} ${Object.keys(this.samples).length}`);
        }

        const rows: AggregatedReadingLike[] = Object.entries(this.samples)
            .filter(([key, value]: [string, number[]]) => {
                return value.length > 0;
            })
            .map((entry) => {
                const [key, values]: [string, number[]] = entry;
                return {
                    aggregate: this.name,
                    time: this.openTime,
                    sensorKey: key,
                    value: _.sum(values) / values.length,
                };
            });

        this.samples = {};

        return rows;
    }
}

function timePromise<T>(name: string, makePromise: () => Promise<T>): Promise<T> {
    const started = new Date();
    return makePromise().then((value) => {
        const ended = new Date();
        const elapsed = ended.getTime() - started.getTime();
        console.log(`timed:${name}: ${elapsed}`);
        return value;
    });
}

export class Aggregator {
    private readonly aggregates: Aggregate[];
    private rows: AggregatedReadingLike[] = [];

    constructor(public readonly deviceId: string) {
        this.aggregates = Aggregate.getAll();
    }

    public async process(db: ReadingsDatabase, batch: Readings[]): Promise<any> {
        for (const readings of batch) {
            for (const aggregate of this.aggregates) {
                for (const row of aggregate.maybeFlush(db, readings.time)) {
                    this.rows.push(row);
                }
            }

            this.aggregates.forEach((aggregate) => {
                Object.entries(readings.readings).forEach(([key, value]: [string, number]) => aggregate.push(readings.time, key, value));
            });
        }

        await timePromise(`save-aggregates rows=${this.rows.length}`, () => db.saveAggregates(this.rows));

        this.rows = [];
    }
}

export class SaveReadingsTask extends Task {
    public readonly taskName = "SaveReadingsTask";
    private readonly aggregators: { [index: string]: Aggregator } = {};

    constructor(public readonly deviceId: string, private readonly purge: boolean, public readonly readings: Readings[]) {
        super();
    }

    private get name(): string {
        return ReadingsDatabase.nameForDevice(this.deviceId);
    }

    public async run(services: DataServices, tasks: TaskQueuer): Promise<any> {
        if (!this.aggregators[this.deviceId]) {
            console.log("creating aggregator", this.deviceId);
            this.aggregators[this.deviceId] = new Aggregator(this.deviceId);
        }

        if (this.purge) {
            console.log("purging", this.name);
            await ReadingsDatabase.delete(this.name);
        }

        const db = await ReadingsDatabase.open(this.name);

        await this.aggregators[this.deviceId].process(db, this.readings);

        const summary = await db.describe();
        console.log("summary", summary);
    }
}
