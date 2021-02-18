import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class add_uncalibrated_column_20210217_180557 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE sensors ADD COLUMN uncalibrated NUMERIC"]);
    }
}
