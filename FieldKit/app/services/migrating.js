import _ from "lodash";
import moment from "moment";
import Promise from "bluebird";
import { serializePromiseChain } from "../utilities";
import * as AllMigrations from "../migrations";

export default class Migrating {
    up(db) {
        return this._initialize(db).then(() => {
            const all = this._resolve();

            return serializePromiseChain(all, migration => {
                console.log("migration: check", migration.version, migration.name);
                return this._isNecessary(db, migration).then(necessary => {
                    if (necessary) {
                        return this._migrateUp(db, migration);
                    }
                    return {
                        migration,
                        skipped: true,
                    };
                });
            });
        });
    }

    _migrateUp(db, migration) {
        console.log("migration: up", migration.version, migration.name);
        return Promise.resolve(migration.instance.up(db)).then(action => {
            return this._markRan(db, migration).then(() => {
                return {
                    migration,
                    skipped: false,
                };
            });
        });
    }

    _resolve() {
        const nameRe = /(\w+)_(\d+_\d+)/;
        return _(AllMigrations)
            .map((k, v) => {
                return {
                    match: nameRe.exec(k.name),
                    ctor: k,
                };
            })
            .filter(v => v.match)
            .map(row => {
                return {
                    name: row.match[1],
                    version: row.match[2],
                    order: moment(row.match[2], "YYYYMMDD_HHmmss"),
                    instance: new row.ctor(),
                };
            })
            .sortBy(v => v.order)
            .value();
    }

    _isNecessary(db, migration) {
        return db.query("SELECT * FROM migrations WHERE version = ?", [migration.version]).then(found => {
            return found.length == 0;
        });
    }

    _markRan(db, migration) {
        console.log("marking ran", migration.version);
        return db.query("INSERT INTO migrations (version) VALUES (?)", [migration.version]);
    }

    _initialize(db) {
        return db.query(`CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, version TEXT NOT NULL)`).then(() => {
            return db.query(`CREATE UNIQUE INDEX IF NOT EXISTS migrations_idx ON migrations (version)`);
        });
    }
}
