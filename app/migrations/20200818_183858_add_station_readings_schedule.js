import Migration from "./Migration";

export class AddStationReadingsSchedule_20200818_183858 extends Migration {
    up(db) {
        return db.batch(["ALTER TABLE stations ADD COLUMN schedules text"]);
    }
}
