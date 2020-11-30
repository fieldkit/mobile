import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddStationUserId_20201129_145857 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE stations ADD COLUMN user_id INTEGER"]);
    }
}
