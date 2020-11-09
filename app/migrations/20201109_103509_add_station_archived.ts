import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddStationArchived_20201109_103509 extends Migration {
    public async up(db: Database): Promise<void> {
        await db.batch([`ALTER TABLE stations ADD COLUMN archived BOOLEAN`]);
        await db.execute("UPDATE stations SET archived = 0");
    }
}
