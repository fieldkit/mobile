import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddFirmwareLogicalAddress_20210306_140641 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE firmware ADD COLUMN logical_address INTEGER"]);
    }
}
