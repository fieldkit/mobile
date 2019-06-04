import sqlite from 'nativescript-sqlite';

export default class SqliteNativeScript {
    constructor() {
    }

    deleteDatabase(name) {
        sqlite.deleteDatabase(name);
    }

    exists(name) {
        return sqlite.exists(name);
    }

    getRecords(name, sql) {
        return new sqlite(name).then(db => {
            db.resultType(sqlite.RESULTSASOBJECT);
            return db.all(sql)
                .then(resultSet => {
                    return resultSet;
                }, error => {return [];})
        }, error => {
            reject(error);
        });
    }

    open(name) {
        return new Promise(function(resolve, reject) {
            new sqlite(name).then(db => {
                resolve(db);
            }, error => {
                reject(error);
            });
        });
    }

}
