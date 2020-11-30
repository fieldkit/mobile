import _ from "lodash";
import Config from "../config";
import Sqlite, { Database } from "../wrappers/sqlite";
import Migrating from "./migrating";

export default class CreateDB {
    private sqlite: Sqlite;
    private database: Database | null = null;

    constructor() {
        this.sqlite = new Sqlite();
    }

    public getDatabase(): Promise<Database> {
        const db = this.database;
        if (!db) throw new Error("uninitialized database");
        return Promise.resolve(db);
    }

    public initialize(path: string | null, userInvokedDelete: boolean, readOnly: boolean): Promise<Database> {
        return this.open(path, readOnly)
            .then(() => {
                if (!path && (Config.db.drop || userInvokedDelete)) {
                    return this.dropTables().then(() => {
                        return this.database;
                    });
                }
                return this.database;
            })
            .then((db: Database) => {
                const migrations = new Migrating();
                return migrations.up(db).then(() => {
                    return db;
                });
            })
            .then((db: Database) => {
                return db;
            });
    }

    private getDatabaseName(path: string | null): string {
        const globalAny: any = global; // eslint-disable-line
        // eslint-disable-next-line
        if (globalAny.TNS_ENV === "test") {
            if (path) {
                return path;
            }
            return ":memory:";
        }
        return "fieldkit.sqlite3";
    }

    private dropTables(): Promise<void> {
        const db = this.database;
        if (!db) throw new Error("uninitialized database");
        console.log("dropping tables");
        return db.query("SELECT name FROM sqlite_master WHERE type = 'table'").then((tables: { name: string }[]) => {
            const dropping = _(tables)
                .map((table) => table.name)
                .filter((name) => name.indexOf("sqlite_") < 0)
                .value();
            if (dropping.length > 0) {
                console.log("dropping", dropping);
            }
            return db
                .execute(`PRAGMA foreign_keys = OFF`)
                .then(() => {
                    return db.batch(
                        _(dropping)
                            .map((name) => "DROP TABLE " + name)
                            .value()
                    );
                })
                .then(() => db.execute(`PRAGMA foreign_keys = ON`));
        });
    }

    private open(path: string | null, readOnly: boolean): Promise<Database> {
        const opening = this.getDatabaseName(path);
        console.log(`opening: ${opening}`);
        return this.sqlite.open(opening, readOnly).then((db: Database) => {
            // foreign keys are disabled by default in sqlite
            // enable them here
            return db.query(`PRAGMA foreign_keys = ON;`).then(() => {
                this.database = db;
                return db;
            });
        });
    }
}
