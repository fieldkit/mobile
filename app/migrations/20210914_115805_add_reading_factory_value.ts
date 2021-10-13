import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class add_reading_factory_value_20210914_115805 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE sensors ADD COLUMN factory NUMERIC"]);
    }
}
