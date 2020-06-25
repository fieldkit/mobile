import Migration from "./Migration";

export class AddSensorTrend_20200624_193105 extends Migration {
    up(db) {
        return db.batch(["ALTER TABLE sensors ADD COLUMN trend INTEGER"]);
    }
}
