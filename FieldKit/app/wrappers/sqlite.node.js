import sqlite3 from "sqlite3";

class DatabaseWrapper {
    constructor(db) {
        this.db = db;
    }

    query(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    execute(sql, params) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, err => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this);
            });
        });
    }
}

export default class SqliteNodeJs {
    open(name) {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(
                name,
                sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
                err => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(new DatabaseWrapper(db));
                }
            );
        });
    }
}
