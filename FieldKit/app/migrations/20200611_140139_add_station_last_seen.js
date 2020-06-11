import Migration from "./Migration";

export class AddStationLastSeen_20200611_140139 extends Migration {
    up(db) {
        return db.batch([`ALTER TABLE stations ADD COLUMN last_seen DATETIME`]);
    }
}
