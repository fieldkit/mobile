import Migration from "./Migration";

export class AddFirmwareMetaAndBuild_20200424_125253 extends Migration {
    up(db) {
        return db.batch([
            // This is weird... and yet fine, they'll just get the latest firmware again, very shortly.
            `DROP TABLE IF EXISTS firmware`,
            `CREATE TABLE IF NOT EXISTS firmware (
				id INTEGER PRIMARY KEY,
				time TIMESTAMP NOT NULL,
				url TEXT NOT NULL,
				module TEXT NOT NULL,
				profile TEXT NOT NULL,
				etag TEXT NOT NULL,
				path TEXT NOT NULL,
				meta TEXT NOT NULL,
				build_number INTEGER NOT NULL,
				build_time INTEGER NOT NULL
			)`,
        ]);
    }
}
