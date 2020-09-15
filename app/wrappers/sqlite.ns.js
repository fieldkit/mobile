import Sqlite from "nativescript-sqlite";

class DatabaseWrapper {
    constructor(db) {
        this.db = db;
        this.db.resultType(Sqlite.RESULTSASOBJECT);
    }

    query(sql, params) {
        return this.db.all(sql, params).then(
            (rows) => rows,
            (err) => {
                console.log("SQL error", sql, params, err, err ? err.stack : null);
                return Promise.reject(err);
            }
        );
    }

    execute(sql, params) {
        return this.db.execSQL(sql, params).then((res) => {
            return res ? res : this;
        });
    }

    batch(sql) {
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
    open(name) {
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

    delete(name) {
        if (Sqlite.exists(name)) {
            Sqlite.deleteDatabase(name);
        }

        return Promise.resolve({});
    }

    exists(name) {
        return Sqlite.exists(name);
    }

    copy(name) {
        return Sqlite.copyDatabase(name);
    }
}
