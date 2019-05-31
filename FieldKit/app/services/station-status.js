import sqlite from 'nativescript-sqlite';

// temp seed data...
const stations = [
    {"name": "Drammen Station", "status": "Ready to deploy", "updated": "2019-05-30 23:23:09"},
    {"name": "Eggjareid Station", "status": "Deployed", "updated": "2019-03-16 03:52:09"},
    {"name": "Evanger Station", "status": "Deployed", "updated": "2018-01-01 09:32:09"},
    {"name": "Finse Station", "status": "Ready to deploy", "updated": "2017-09-17 13:23:09"},
    {"name": "FieldKit Station 3421", "status": "Configure sensor", "updated": ""},
]

var database = "";

export default class StationStatus {
    constructor() {
        if(!this.checkForDB()) {
            this.createDB();
        }
    }

    checkForDB() {
        // sqlite.deleteDatabase("FieldKitStations");
        return sqlite.exists("FieldKitStations");
    }

    createDB() {
        new sqlite("FieldKitStations")
            .then(db => {
                if(db.isOpen()) {
                    database = db;
                    // new db, create table
                    db.execSQL(
                        "CREATE TABLE IF NOT EXISTS stations (\
                            id INTEGER PRIMARY KEY AUTOINCREMENT, \
                            name TEXT, \
                            status TEXT, \
                            created DATETIME DEFAULT CURRENT_TIMESTAMP, \
                            updated DATETIME DEFAULT CURRENT_TIMESTAMP)")
                    .then(seedTable)
                    .catch(handleCreationError);
                }
            }, error => {
                // console.log("Failed to open database", error);
            });

        // temporarily seed some data
        function seedTable() {
            stations.forEach(function(s) {
                database.execSQL("INSERT INTO stations (name, status, updated) VALUES (?, ?, ?)", [s.name, s.status, s.updated])
                .then(id => {
                    if(id == stations.length) {
                        database.close();
                    }
                }, error => {
                    // console.log("Data was not inserted", error)
                })
            });
        }

        function handleCreationError(error) {
            // console.log("Table was not created", error)
            database.close();
        }
    }

    getAll() {
        // return promise (chain)
        return new sqlite("FieldKitStations")
            .then(db => {
                db.resultType(sqlite.RESULTSASOBJECT);
                return db.all('SELECT * FROM Stations', function(err, resultSet) {
                    return resultSet;
                })
            }, error => {
                // console.log("Error retrieving data", error);
                Promise.resolve([]);
            });
    }

}