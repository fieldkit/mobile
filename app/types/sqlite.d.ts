declare module "nativescript-sqlite" {
    type Rows = any[];

    type Callback = (err: Error, db: SqliteMain) => void;

    class SqliteMain {
        static RESULTSASOBJECT: number;
        static HAS_COMMERCIAL: boolean;
        static HAS_ENCRYPTION: boolean;
        static HAS_SYNC: boolean;

        constructor(name: string, callback: Callback);

        resultType(type: number): void;
        all(query: string, params: undefined | any[]): Promise<Rows>;
        execSQL(query: string, params: undefined | any[]): Promise<Rows>;

        static exists(name: string): boolean;
        static copyDatabase(name: string): void;
        static deleteDatabase(name: string): void;
    }

    export = SqliteMain;
}
