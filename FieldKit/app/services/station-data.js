import CreateDB from "./create-db";

export default class StationData {
    constructor() {
        this.databasePromise = new CreateDB().getDatabase();
    }

    getConfigs(deviceId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM config WHERE device_id=" + deviceId)
        );
    }

    getDatabase() {
        return this.databasePromise;
    }

    getAll() {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM stations")
        );
    }

    getStation(deviceId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM stations WHERE device_id='" + deviceId + "'")
        );
    }

    getModules(deviceId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM modules WHERE device_id IN ('" + deviceId + "')")
        );
    }

    getSensors(moduleId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM sensors WHERE module_id IN ('" + moduleId + "')")
        );
    }

    setStationName(station) {
        return this.getDatabase().then(db =>
            db.query(
                "UPDATE stations SET name='" +
                    station.name +
                    "' WHERE id=" +
                    station.id
            )
        );
    }

    recordConfigChange(config) {
        return this.getDatabase().then(db =>
            db.query(
                "INSERT INTO config (device_id, before, after, affected_field, author) VALUES (?, ?, ?, ?, ?)",
                [
                    config.device_id,
                    config.before,
                    config.after,
                    config.affected_field,
                    config.author
                ]
            )
        );
    }
}
