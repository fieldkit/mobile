import Migration from "./Migration";

export class add_serialized_status_20200504_104038 extends Migration {
    up(db) {
        return db.batch([`ALTER TABLE stations ADD COLUMN serialized_status text`]);
    }
}
