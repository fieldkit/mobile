import Migration from "./Migration";

export class AddModuleFlags_20200715_075044 extends Migration {
    up(db) {
        return db.batch(["ALTER TABLE modules ADD COLUMN flags INTEGER NOT NULL DEFAULT 0"]);
    }
}
