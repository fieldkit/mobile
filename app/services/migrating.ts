import _ from "lodash";
import moment from "moment";
import Promise from "bluebird";
import { serializePromiseChain } from "../utilities";
import * as AllMigrations from "../migrations";
import Config from "../config";

const log = Config.logger("Migrations");

export default class Migrating {
    public up(db) {
        return this.initialize(db)
            .then(() => {
                const all = this.resolve();

                return serializePromiseChain(all, (migration) => {
                    log.verbose("migration: check", migration.version, migration.name);
                    return this.isNecessary(db, migration).then((necessary) => {
                        if (necessary) {
                            return this.migrateUp(db, migration);
                        }
                        return {
                            migration,
                            skipped: true,
                        };
                    });
                });
            })
            .catch((err) => {
                log.error("error:", err, err ? err.stack : null);
                return Promise.reject(err);
            });
    }

    private migrateUp(db, migration) {
        log.info("migration: up", migration.version, migration.name);
        return Promise.resolve(migration.instance.up(db)).then((action) => {
            return this.markRan(db, migration).then(() => {
                return {
                    migration,
                    skipped: false,
                };
            });
        });
    }

    private resolve() {
        const nameRe = /(\w+)_(\d+_\d+)/;
        return _(AllMigrations)
            .map((k, v) => {
                return {
                    match: nameRe.exec(k.name),
                    ctor: k,
                };
            })
            .map((row) => {
                if (!row.match) {
                    return [];
                }
                return [
                    {
                        name: row.match[1],
                        version: row.match[2],
                        order: moment(row.match[2], "YYYYMMDD_HHmmss"),
                        instance: new row.ctor(),
                    },
                ];
            })
            .flatten()
            .sortBy((v) => v.order)
            .value();
    }

    private isNecessary(db, migration) {
        return db.query("SELECT * FROM migrations WHERE version = ?", [migration.version]).then((found) => {
            return found.length == 0;
        });
    }

    private markRan(db, migration) {
        log.info("marking ran", migration.version);
        return db.query("INSERT INTO migrations (version) VALUES (?)", [migration.version]);
    }

    private initialize(db) {
        return db.query(`CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, version TEXT NOT NULL)`).then(() => {
            return db.query(`CREATE UNIQUE INDEX IF NOT EXISTS migrations_idx ON migrations (version)`);
        });
    }
}
