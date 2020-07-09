import Migration from "./Migration";

export class AddNotesTable_20200708_162023 extends Migration {
    up(db) {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY,
                created_at TIMESTAMP NOT NULL,
                updated_at TIMESTAMP NOT NULL,
                station_id INTEGER NOT NULL,
                notes TEXT NOT NULL
            )`,
        ]);
    }
}
