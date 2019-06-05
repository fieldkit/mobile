import Sqlite from '../wrappers/sqlite';
const sqlite = new Sqlite();

// temp seed data...
const stations = [
    {"name": "Drammen Station", "status": "Ready to deploy", "updated": "2019-05-30 23:23:09"},
    {"name": "Eggjareid Station", "status": "Deployed", "updated": "2019-03-16 03:52:09"},
    {"name": "Evanger Station", "status": "Deployed", "updated": "2018-01-01 09:32:09"},
    {"name": "Finse Station", "status": "Ready to deploy", "updated": "2017-09-17 13:23:09"},
    {"name": "FieldKit Station 3421", "status": "Configure sensor", "updated": ""},
];

let database = "";

export default class StationsList {
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
        sqlite.open("FieldKitStations")
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
            let result = stations.reduce( (previousPromise, nextStation) => {
                return previousPromise.then(() => {
                    return database.execSQL("INSERT INTO stations (name, status, updated) VALUES (?, ?, ?)", [nextStation.name, nextStation.status, nextStation.updated]);
                });
            }, Promise.resolve() );

            result.then(e => {
              database.close();
            });
        }

        function handleCreationError(error) {
            // console.log("Table was not created", error)
            database.close();
        }
    }

    getAll() {
        return sqlite.getRecords("FieldKitStations", "SELECT * FROM stations");
    }

}
