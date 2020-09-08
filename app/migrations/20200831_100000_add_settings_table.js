import Migration from "./Migration";

export class AddSettingsTable_20200831_100000 extends Migration {
    up(db) {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                settings TEXT NOT NULL
            )`,
        ]);
    }
}
