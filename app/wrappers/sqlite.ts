const Sqlite = require("nativescript-sqlite");

class DatabaseWrapper {
    constructor(private readonly db: any) {
        this.db = db;
        this.db.resultType(Sqlite.RESULTSASOBJECT);
    }

    public query(sql: string, params = undefined) {
        // console.log("QUERY", sql, params);
        return this.db.all(sql, params).then(
            (rows) => rows,
            (err) => {
                console.log("SQL error", sql, params, err, err ? err.stack : null);
                return Promise.reject(err);
            }
        );
    }

    public execute(sql: string, params = undefined) {
        return this.db.execSQL(sql, params).then((res) => {
            return res ? res : this;
        });
    }

    public batch(sql) {
        // console.log("BATCH", sql);
        let sqlArray = sql;
        if (!Array.isArray(sql)) {
            sqlArray = [sql];
        }
        return sqlArray.reduce((promise, item, index) => {
            return promise
                .then((values) =>
                    this.execute(item).then((value) => {
                        values.push(value);
                        return values;
                    })
                )
                .catch((err) => {
                    console.log("SQL error", sql, err, err ? err.stack : null);
                    return Promise.reject(err);
                });
        }, Promise.resolve([]));
    }
}

export default class SqliteNativeScript {
    public open(name): Promise<DatabaseWrapper> {
        console.log("sqlite:opening", name, Sqlite.HAS_COMMERCIAL, Sqlite.HAS_ENCRYPTION, Sqlite.HAS_SYNC);

        return new Promise((resolve, reject) => {
            new Sqlite(name, (err, db) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(new DatabaseWrapper(db));
            });
        });
    }

    public delete(name): Promise<void> {
        if (Sqlite.exists(name)) {
            Sqlite.deleteDatabase(name);
        }

        return Promise.resolve();
    }

    public exists(name): boolean {
        return Sqlite.exists(name);
    }

    public copy(name): boolean {
        return Sqlite.copyDatabase(name);
    }
}
