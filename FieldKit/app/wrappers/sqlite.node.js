import sqlite from 'sqlite3';

export default class SqliteNodeJs {
    constructor() {
    }

    exists() {
        // sqlite OPEN_CREATE makes this unnecessary
        return true;
    }

    getRecords(name, sql) {
       var db = new sqlite.Database("TEST_DB", sqlite.OPEN_READONLY, (error) => {
            db.all("SELECT * FROM lorem", (err, rows) => {
                // this fails because it needs a callback function
                return rows
            });
        });
    }

    open(name) {
        return new Promise(function(resolve, reject) {
            var db = new sqlite.Database(name, (error) => {
                if(error) {reject(error);}
                resolve(db);
            });
        })
    }
}



