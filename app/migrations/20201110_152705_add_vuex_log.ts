import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddVuexLog_20201110_152705 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch([
            `CREATE TABLE IF NOT EXISTS store_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                time TIMESTAMP NOT NULL,
                mutation TEXT NOT NULL,
                payload TEXT NOT NULL,
                before TEXT NOT NULL,
                after TEXT NOT NULL
            )`,
        ]);
    }
}
