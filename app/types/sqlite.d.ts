declare module "nativescript-sqlite" {
    let RESULTASOBJECT: number;
    let HAS_COMMERCIAL: boolean;
    let HAS_ENCRYPTION: boolean;
    let HAS_SYNC: boolean;

    declare type Rows = any[];

    declare class SqliteMain {
        constructor(name: string);

        resultType(type: number): void;
        all(query: string, params: undefined | any[]): Promise<Rows>;
        execSQL(query: string, params: undefined | any[]): Promise<Rows>;

        static exists(name: string): boolean;
        static copyDatabase(name: string): void;
        static deleteDatabase(name: string): void;
    }

    export = SqliteMain;
}
