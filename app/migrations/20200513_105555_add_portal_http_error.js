import Migration from "./Migration";

export class AddPortalHttpError_20200513_105555 extends Migration {
    up(db) {
        return db.batch([`ALTER TABLE stations ADD COLUMN portal_http_error INTEGER`]);
    }
}
