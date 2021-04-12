import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddStationsForgetting_20210412_134930 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE stations ADD COLUMN forgetting INTEGER", "UPDATE stations SET forgetting = 0"]);
    }
}
