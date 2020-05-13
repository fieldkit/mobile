import Migration from "./Migration";

export class AddEventHistoryTable_20200513_150731 extends Migration {
    up(db) {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS event_history (
                id INTEGER PRIMARY KEY,
                created_at TIMESTAMP NOT NULL,
                type TEXT NOT NULL,
                body TEXT NOT NULL
            )`,
        ]);
    }
}
