import CreateDB from './create-db';

export default class StationData {
    constructor() {
        this.databasePromise = new CreateDB().getDatabase();
    }

    getDatabase() {
        return this.databasePromise;
    }

    getAll() {
        return this.getDatabase().then(db => db.query("SELECT * FROM stations"));
    }

    getStation(id) {
        return this.getDatabase().then(db => db.query("SELECT * FROM stations WHERE id=" + id));
    }

    getModules(ids) {
        return this.getDatabase().then(db => db.query("SELECT * FROM modules WHERE id IN (" + ids + ")"));
    }

    getSensors(ids) {
        return this.getDatabase().then(db => db.query("SELECT * FROM sensors WHERE id IN (" + ids + ")"));
    }
}
