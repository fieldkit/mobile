import Migration from "./Migration";

export class AddNotificationsTable_20201005_125533 extends Migration {
    up(db) {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key TEXT NOT NULL,
                kind TEXT NOT NULL,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                silenced BOOL NOT NULL DEFAULT false,
                dismissed_at TIMESTAMP,
                satisfied_at TIMESTAMP,
                project TEXT,
                user TEXT,
                station TEXT,
                actions TEXT
            )`,
        ]);
    }
}
