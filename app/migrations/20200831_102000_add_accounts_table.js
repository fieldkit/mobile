import Migration from "./Migration";

export class AddAccountsTable_20200831_102000 extends Migration {
    up(db) {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS accounts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                portal_id TEXT,
                token TEXT
            )`,
        ]);
    }
}
