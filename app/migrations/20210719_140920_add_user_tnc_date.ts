import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddUserTncDate_20210719_140920 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE accounts ADD COLUMN tnc_date TIMESTAMP"]);
    }
}
