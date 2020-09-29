import Migration from "./Migration";

export class AddConnectionHistory_20200929_125831 extends Migration {
    up(db) {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS station_addresses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                station_id TEXT NOT NULL,
                time TIMESTAMP NOT NULL,
                url TEXT NOT NULL
            )`,
        ]);
    }
}
