import Migration from "./Migration";

export class AddAccountTimeStamp_20200914_114116 extends Migration {
    up(db) {
        return db.batch([`ALTER TABLE accounts ADD COLUMN used_at TIMESTAMP`]);
    }
}
