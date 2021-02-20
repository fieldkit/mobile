import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class RenameCurrentReading_20210217_180912 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE sensors ADD COLUMN reading NUMERIC", "UPDATE sensors SET reading = current_reading"]);
    }
}
