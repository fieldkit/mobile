import CreateDB from "./create-db";

export default class StationData {
    constructor() {
        this.databasePromise = new CreateDB().getDatabase();
    }

    getConfigs(stationId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM config WHERE station_id=" + stationId)
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

    getStation(stationId) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM stations WHERE id=" + stationId)
        );
    }

    getModules(moduleIds) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM modules WHERE id IN (" + moduleIds + ")")
        );
    }

    getSensors(sensorIds) {
        return this.getDatabase().then(db =>
            db.query("SELECT * FROM sensors WHERE id IN (" + sensorIds + ")")
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
                "INSERT INTO config (station_id, before, after, affected_field, author) VALUES (?, ?, ?, ?, ?)",
                [
                    config.station_id,
                    config.before,
                    config.after,
                    config.affected_field,
                    config.author
                ]
            )
        );
    }
}
