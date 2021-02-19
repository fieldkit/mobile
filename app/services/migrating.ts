import _ from "lodash";
import moment from "moment";
import { serializePromiseChain } from "@/lib";
import Migration from "../migrations/Migration";
import * as AllMigrations from "../migrations";
import Config from "../config";
import { Database } from "@/wrappers/sqlite";

const log = Config.logger("Migrations");

interface ResolvedMigration {
    name: string;
    version: string;
    order: number;
    instance: Migration;
}

export default class Migrating {
    public up(db: Database): Promise<void> {
        return this.initialize(db)
            .then(() => {
                const all: ResolvedMigration[] = this.resolve();

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
                log.error("error:", err, err ? err.stack : null); // eslint-disable-line
                return Promise.reject(err);
            })
            .then(() => Promise.resolve());
    }

    private migrateUp(db: Database, migration: ResolvedMigration) {
        log.info("migration: up", migration.version, migration.name);
        return Promise.resolve(migration.instance.up(db)).then(() => {
            return this.markRan(db, migration).then(() => {
                return {
                    migration,
                    skipped: false,
                };
            });
        });
    }

    private resolve(): ResolvedMigration[] {
        const nameRe = /(\w+)_(\d+_\d+)/;
        return _(AllMigrations)
            .map((k) => {
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
                        order: moment(row.match[2], "YYYYMMDD_HHmmss").unix(),
                        instance: new row.ctor(),
                    },
                ];
            })
            .flatten()
            .sortBy((v) => v.order)
            .value();
    }

    private isNecessary(db: Database, migration: ResolvedMigration): Promise<boolean> {
        return db.query("SELECT * FROM migrations WHERE version = ?", [migration.version]).then((found) => {
            return found.length == 0;
        });
    }

    private markRan(db: Database, migration: ResolvedMigration): Promise<void> {
        log.info("marking ran", migration.version);
        return db.execute("INSERT INTO migrations (version) VALUES (?)", [migration.version]);
    }

    private initialize(db: Database): Promise<void> {
        return db
            .execute(`CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, version TEXT NOT NULL)`)
            .then(() => db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS migrations_idx ON migrations (version)`));
    }
}
