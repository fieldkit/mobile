import sqlite3 from "sqlite3";
import Promise from "bluebird";

class DatabaseWrapper {
    constructor(db) {
        this.db = db;
    }

    query(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.log(sql, err);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    execute(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) {
                    console.log(sql, err);
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
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
                    console.log("SQL error", sql, err);
                });
        }, Promise.resolve([]));
    }
}

export default class SqliteNodeJs {
    open(name) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(name, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(new DatabaseWrapper(db));
            });
        });
    }

    delete(name) {
        return Promise.resolve({});
    }
}
