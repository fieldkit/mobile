import Sqlite from "nativescript-sqlite";

export interface Database {
    // eslint-disable-next-line
    query<T>(sql: string, params?: undefined | any[]): Promise<T[]>;
    // eslint-disable-next-line
    execute(sql: string, params?: undefined | any[]): Promise<void>;
    batch(sql: string | string[]): Promise<void>;
}

export type QueriedRow = Record<string, unknown>;

export type Rows = QueriedRow[];

class DatabaseWrapper implements Database {
    constructor(private readonly db: Sqlite) {
        this.db.resultType(Sqlite.RESULTSASOBJECT);
    }

    // eslint-disable-next-line
    public query<T>(sql: string, params: undefined | any[] = undefined): Promise<T[]> {
        // console.log("QUERY", sql, params);
        return this.db.all(sql, params).then(
            (rows: T[]) => rows,
            (err: Error) => {
                console.log("SQL error", sql, params, err, err ? err.stack : null);
                return Promise.reject(err);
            }
        );
    }

    // eslint-disable-next-line
    public async execute(sql: string, params: undefined | any[] = undefined): Promise<void> {
        await this.db.execSQL(sql, params);
    }

    public batch(sql: string | string[]): Promise<void> {
        const sqlArray: string[] = (() => {
            if (!Array.isArray(sql)) {
                return [sql];
            }
            return sql;
        })();

        return sqlArray
            .reduce((promise: Promise<Rows[]>, item: string) => {
                return promise
                    .then((values: Rows[]) =>
                        this.query(item).then((value: Rows) => {
                            values.push(value);
                            return values;
                        })
                    )
                    .catch((err: Error) => {
                        console.log("SQL error", sql, err, err ? err.stack : null);
                        return Promise.reject(err);
                    });
            }, Promise.resolve([]))
            .then(() => {
                return;
            });
    }
}

export default class SqliteNativeScript {
    public open(name: string, _readOnly: boolean): Promise<Database> {
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

    public delete(name: string): Promise<void> {
        if (Sqlite.exists(name)) {
            Sqlite.deleteDatabase(name);
        }
        return Promise.resolve();
    }

    public exists(name: string): boolean {
        return Sqlite.exists(name);
    }

    public copy(name: string): void {
        Sqlite.copyDatabase(name);
    }
}
