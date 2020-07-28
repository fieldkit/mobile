import Migration from "./Migration";

export class AddModuleStatus_20200727_164448 extends Migration {
    up(db) {
        return db.batch(["ALTER TABLE modules ADD COLUMN status text"]);
    }
}
