import Migration from "./Migration";

export class AddPortalUpdatedTime_20200723_093924 extends Migration {
    up(db) {
        return db.batch(["ALTER TABLE stations ADD COLUMN portal_updated DATETIME"]);
    }
}
