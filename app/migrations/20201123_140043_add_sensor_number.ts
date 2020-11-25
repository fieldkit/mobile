import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddSensorNumber_20201123_140043 extends Migration {
    public async up(db: Database): Promise<void> {
        await db.batch([`ALTER TABLE sensors ADD COLUMN position INTEGER`]);
        await db.execute("UPDATE sensors SET position = id");
    }
}
