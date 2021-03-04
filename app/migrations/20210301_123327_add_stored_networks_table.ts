import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddStoredNetworks_20210301_123327 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS stored_networks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
        ]);
    }
}
