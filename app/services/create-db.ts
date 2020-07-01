import _ from "lodash";
import Promise from "bluebird";
import Config from "../config";
import Sqlite from "../wrappers/sqlite";
import Migrating from "./migrating";

export default class CreateDB {
    sqlite: any;
    promisedDatabase: Promise<any>;
    resolveDatabase: any | null = null;
    database: any | null = null;

    constructor() {
        this.sqlite = new Sqlite();
        this.promisedDatabase = new Promise(resolve => {
            this.resolveDatabase = resolve;
        });
    }

    getDatabase() {
        return this.promisedDatabase;
    }

    initialize(userInvokedDelete: boolean | null, path: string | null) {
        console.log("opening", userInvokedDelete);
        return this._open(path)
            .then(() => {
                if (!path && (Config.dropTables || userInvokedDelete)) {
                    return this.dropTables();
                }
                return Promise.resolve(this.database);
            })
            .then(() => {
                const migrations = new Migrating();
                return migrations.up(this.database);
            })
            .then(() => {
                this.resolveDatabase(this.database);
                return this.database;
            });
    }

    getDatabaseName(path: string | null) {
        const globalAny: any = global;
        if (globalAny.TNS_ENV === "test") {
            if (path) {
                return path;
            }
            return ":memory:";
        }
        return "fieldkit.sqlite3";
    }

    dropTables() {
        console.log("dropping tables");
        return this.database.query("SELECT name FROM sqlite_master WHERE type = 'table'").then(tables => {
            const dropping = _(tables)
                .map(table => table.name)
                .filter(name => name.indexOf("sqlite_") < 0)
                .value();
            if (dropping.length > 0) {
                console.log("dropping", dropping);
            }
            return this.database
                .query(`PRAGMA foreign_keys = OFF`)
                .then(() => {
                    return this.database.batch(
                        _(dropping)
                            .map(name => "DROP TABLE " + name)
                            .value()
                    );
                })
                .then(() => {
                    return this.database.query(`PRAGMA foreign_keys = ON`);
                });
        });
    }

    _open(path: string | null) {
        return this.sqlite.open(this.getDatabaseName(path)).then(db => {
            // foreign keys are disabled by default in sqlite
            // enable them here
            db.query(`PRAGMA foreign_keys = ON;`);
            this.database = db;
            return this.database;
        });
    }
}
