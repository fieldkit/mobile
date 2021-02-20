import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddStationLogs_20210219_151559 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS station_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                time TIMESTAMP NOT NULL,
                logs TEXT NOT NULL
            )`,
        ]);
    }
}
