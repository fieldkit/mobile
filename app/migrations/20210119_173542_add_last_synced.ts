import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddLastSynced_20210119_173542 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE accounts ADD COLUMN last_synced TIMESTAMP"]);
    }
}
