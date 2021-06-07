/*
import _ from "lodash";
import Sqlite, { Database } from "@/wrappers/sqlite";
import { sqliteToJs, serializePromiseChain } from "./utilities";
import { Readings } from "./readings";
import { DataServices } from "./data-services";
import { Task, TaskQueuer } from "./tasks";

export class DataQueryParams {
    public static MaxTime = 8640000000000000;
    public static MinTime = -8640000000000000;

    constructor(
        public readonly start: number,
        public readonly end: number,
        public readonly sensorIds: number[] = [],
        public readonly aggregate: string = Aggregate.Default,
        public readonly page: number = 0,
        public readonly pageSize: number = 1000
    ) {}
}

export interface SensorSummary {
    id: number;
    key: string;
    records: number;
}

export class AggregateSummary {
    constructor(
        public readonly aggregate: Aggregate,
        public readonly start: number,
        public readonly end: number,
        public readonly sensors: SensorSummary[]
    ) {}

    public get name(): string {
        return this.aggregate.name;
    }

    public get records(): number {
        return _.sum(this.sensors.map((s) => s.records));
    }

    public get sensorIds(): number[] {
        return this.sensors.map((s) => s.id);
    }
}

export class Summaries {
    constructor(public readonly summaries: AggregateSummary[]) {}

    public makeDefaultParams(): DataQueryParams {
        const aggSummary = this.pickAggregate();
        return new DataQueryParams(aggSummary.start, aggSummary.end, aggSummary.sensorIds, aggSummary.name);
    }

    private pickAggregate(): AggregateSummary {
        const aggSummary = _.first(this.summaries.filter((s) => s.records < 1000));
        if (!aggSummary) throw new Error(`no suitable aggregate summary`);
        return aggSummary;
    }
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
    aggregate: Aggregate;
    time: number;
    sensorKey: string;
    value: number;
}

export class ReadingsDatabase {
    private sensors: { [index: string]: Sensor } = {};

    constructor(private readonly db: Database) {}

    public static async delete(name: string): Promise<void> {
        const sqlite = new Sqlite();
        await sqlite.delete(name);
    }

    public static nameForDevice(deviceId: string): string {
        return deviceId + ".sqlite3";
    }

    public static async forDevice(deviceId: string): Promise<ReadingsDatabase> {
        return ReadingsDatabase.open(ReadingsDatabase.nameForDevice(deviceId));
    }

    public static async existsForDevice(deviceId: string): Promise<boolean> {
        const sqlite = new Sqlite();
        const e = sqlite.exists(ReadingsDatabase.nameForDevice(deviceId));
        return Promise.resolve(e);
    }

    public static async open(name: string): Promise<ReadingsDatabase> {
        const sqlite = new Sqlite();
        const db = await sqlite.open(name, false);
        await db.query(`PRAGMA foreign_keys = ON;`);
        await db.query(`PRAGMA synchronous = OFF;`);
        await db.query(`PRAGMA journal_mode = MEMORY;`);
        const readingsDb = new ReadingsDatabase(db);
        await readingsDb.create();
        return readingsDb;
    }

    public async create(): Promise<void> {
        await this.db.batch([
            `CREATE TABLE IF NOT EXISTS sensors (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				key TEXT NOT NULL
			)`,
            `CREATE UNIQUE INDEX IF NOT EXISTS sensors_idx ON sensors (key)`,
        ]);

        await Promise.all(
            Aggregate.getAll().map(async (aggregate) => {
                const table = aggregate.table;
                await this.db.batch([
                    `CREATE TABLE IF NOT EXISTS ${table} (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					time DATETIME NOT NULL,
					sensor_id INTEGER NOT NULL,
					value NUMERIC NOT NULL
				)`,
                    // `CREATE UNIQUE INDEX IF NOT EXISTS ${table}_idx ON ${table} (time, sensor_id)`,
                ]);
            })
        );

        await this.refreshSensors();
    }

    private get sensorKeys(): string[] {
        return Object.keys(this.sensors);
    }

    private get numberOfSensors(): number {
        return this.sensorKeys.length;
    }

    private async refreshSensors(): Promise<{ [index: string]: Sensor }> {
        const rows = await this.db.query<{ id: number; key: string }>(`SELECT * FROM sensors ORDER BY key`);
        const previousSize = this.numberOfSensors;
        this.sensors = _.keyBy(
            rows.map((r) => new Sensor(r.id, r.key)),
            (s) => s.key
        );
        if (previousSize !== this.numberOfSensors) {
            debug.log(`sensors: ${this.numberOfSensors - previousSize} ${JSON.stringify(this.sensorKeys)}`);
        }
        return this.sensors;
    }

    public async findSensor(key: string): Promise<Sensor> {
        if (this.sensors[key]) {
            return Promise.resolve(this.sensors[key]);
        }

        await this.db.execute(`INSERT INTO sensors (key) VALUES (?)`, [key]);

        await this.refreshSensors();

        if (!this.sensors[key]) {
            debug.log(`error finding sensor: ${key}`);
            throw new Error(`error finding sensor: ${key}`);
        }

        return Promise.resolve(this.sensors[key]);
    }

    public async save(readings: AggregatedReadingLike[]): Promise<void> {
        const sensorKeys = _.uniq(readings.map((r) => r.sensorKey));
        const sensorPairs = await Promise.all(sensorKeys.map((key) => this.findSensor(key).then((sensor) => [key, sensor])));
        const sensors: { [index: string]: Sensor } = _.fromPairs(sensorPairs);

        await this.db.execute(`BEGIN TRANSACTION`);

        return serializePromiseChain(readings, (reading: AggregatedReadingLike) => {
            const sensor = sensors[reading.sensorKey];
            if (!sensor) {
                throw new Error(`missing sensor: ${reading.sensorKey}`);
            }
            const table = reading.aggregate.table;
            const values = [reading.time, sensor.id, reading.value];
            return this.db
                .execute(
                    `
					INSERT INTO ${table} (time, sensor_id, value)
					VALUES (?, ?, ?)
					`,
                    values
                )
                .catch((error) => {
                    debug.log(`sql:error: ${JSON.stringify(error)} ${JSON.stringify(values)}`);
                    return Promise.reject(error);
                });
        })
            .then(() => {
                return this.db.execute(`COMMIT TRANSACTION`);
            })
            .catch(() => {
                return this.db.execute(`ROLLBACK TRANSACTION`);
            });
    }

    public async describe(aggregate: Aggregate): Promise<AggregateSummary> {
        const table = aggregate.table;
        const times = sqliteToJs<{ start: number; end: number }>(
            await this.db.query(`SELECT MIN(time) AS start, MAX(time) AS end FROM ${table}`)
        );
        const sensors = sqliteToJs<SensorSummary>(
            await this.db.query(
                `SELECT sensor_id AS id, sensors.key, COUNT(*) AS records FROM ${table} JOIN sensors ON (sensor_id = sensors.id) GROUP BY sensor_id`
            )
        );
        if (times.length != 1) throw new Error(`no rows in aggregate table`);
        return new AggregateSummary(aggregate, times[0].start, times[0].end, sensors);
    }

    public async summarize(): Promise<Summaries> {
        const summaries = await Promise.all(Aggregate.getAll().map((aggregate) => this.describe(aggregate)));
        return new Summaries(_.reverse(_.sortBy(summaries, (s) => s.aggregate.interval)));
    }

    public async query(params: DataQueryParams): Promise<ReadingRow[]> {
        if (params.sensorIds.length == 0) {
            debug.log(`no sensor ids`);
            return [];
        }
        const aggregate = Aggregate.byName(params.aggregate);
        const table = aggregate.table;
        const questions = _.times(params.sensorIds.length, _.constant("?")).join(", ");
        const values = [params.start, params.end, ...params.sensorIds, params.pageSize, params.page * params.pageSize];
        const rawRows = await this.db.query(
            `SELECT * FROM ${table} WHERE (time > ? AND time < ?) AND (sensor_id IN (${questions})) ORDER BY time, sensor_id LIMIT ? OFFSET ?`,
            values
        );
        return sqliteToJs(rawRows);
    }
}

export class Aggregate {
    public samples: { [index: string]: number[] } = {};
    public openTime = 0;

    constructor(public readonly name: string, public readonly interval: number) {}

    public get table(): string {
        return "aggregated_" + this.name;
    }

    public static byName(name: string): Aggregate {
        const m = Aggregate.getAll().filter((a) => a.name == name);
        if (m.length != 1) {
            throw new Error(`unable to find aggregate: ${name}`);
        }
        return m[0];
    }

    public static Default = "24h";

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
        if (rounded < this.openTime) {
            debug.log(`moving backward: ${rounded} ${this.openTime}`);
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

    public flush(_db: ReadingsDatabase): AggregatedReadingLike[] {
        // eslint-disable-next-line
        if (false && Object.keys(this.samples).length > 0) {
            // eslint-disable-next-line
            debug.log(`flush: ${this.name} ${this.openTime} ${Object.keys(this.samples).length}`);
        }

        const rows: AggregatedReadingLike[] = Object.entries(this.samples)
            .filter(([_key, value]: [string, number[]]) => {
                return value.length > 0;
            })
            .map((entry) => {
                const [key, values]: [string, number[]] = entry;
                return {
                    aggregate: this,
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
        debug.log(`timed:${name}: ${elapsed}`);
        return value;
    });
}

export class Aggregator {
    private readonly aggregates: Aggregate[];
    private rows: AggregatedReadingLike[] = [];

    constructor(public readonly deviceId: string) {
        this.aggregates = Aggregate.getAll();
    }

    public async process(db: ReadingsDatabase, batch: Readings[]): Promise<void> {
        for (const readings of batch) {
            for (const aggregate of this.aggregates) {
                for (const row of aggregate.maybeFlush(db, readings.time)) {
                    this.rows.push(row);
                }
            }

            // debug.log("READINGS", readings.record, readings.time, readings.uptime);

            this.aggregates.forEach((aggregate) => {
                Object.entries(readings.readings).forEach(([key, value]: [string, number]) => aggregate.push(readings.time, key, value));
            });
        }

        await timePromise(`save-aggregates rows=${this.rows.length}`, () => db.save(this.rows));

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

    public async run(_services: DataServices, _tasks: TaskQueuer): Promise<void> {
        if (!this.aggregators[this.deviceId]) {
            debug.log("creating aggregator", this.deviceId);
            this.aggregators[this.deviceId] = new Aggregator(this.deviceId);
        }

        if (this.purge) {
            debug.log("purging", this.name);
            await ReadingsDatabase.delete(this.name);
        }

        const db = await ReadingsDatabase.open(this.name);

        await this.aggregators[this.deviceId].process(db, this.readings);
    }
}
*/
