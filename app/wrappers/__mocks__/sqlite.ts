import sqlite3 from "sqlite3";

type Rows = any[];

class DatabaseWrapper {
    constructor(private readonly db: sqlite3.Database) {}

    public query(sql: string, params: undefined | any[] = undefined): Promise<Rows> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: Error, rows: Rows) => {
                if (err) {
                    console.log(sql, err);
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }

    public execute(sql: string, params: undefined | any[] = undefined): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err: Error) {
                if (err) {
                    console.log(sql, err);
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }

    public batch(sql: string | string[]): Promise<Rows[]> {
        const sqlArray: string[] = (() => {
            if (!Array.isArray(sql)) {
                return [sql];
            }
            return sql;
        })();
        return sqlArray.reduce((promise: Promise<Rows[]>, item: string) => {
            return promise
                .then((values: Rows[]) =>
                    this.query(item).then((value: Rows) => {
                        values.push(value);
                        return values;
                    })
                )
                .catch((err: Error) => {
                    console.log("SQL error", sql, err);
                    return Promise.reject(err);
                });
        }, Promise.resolve([]));
    }
}

export default class SqliteNodeJs {
    public open(name: string): Promise<DatabaseWrapper> {
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

    public delete(/*name: string*/): Promise<void> {
        return Promise.resolve();
    }

    public exists(/*name: string*/): boolean {
        return false;
    }

    public copy(/*name: string*/): boolean {
        return false;
    }
}
