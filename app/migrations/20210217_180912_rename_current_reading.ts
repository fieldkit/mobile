import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class rename_current_reading_20210217_180912 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE sensors RENAME COLUMN current_reading TO reading"]);
    }
}
