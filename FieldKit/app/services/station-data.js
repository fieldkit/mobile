import Sqlite from '../wrappers/sqlite';
const sqlite = new Sqlite();

export default class StationData {
    constructor() {
    }

    getAll() {
        return sqlite.getRecords("FieldKitStations", "SELECT * FROM stations");
    }

    getStation(id) {
        return sqlite.getRecords("FieldKitStations", "SELECT * FROM stations WHERE id="+id);
    }

    getModules(ids) {
        return sqlite.getRecords("FieldKitStations", "SELECT * FROM modules WHERE id IN ("+ids+")");
    }

    getSensors(ids) {
        return sqlite.getRecords("FieldKitStations", "SELECT * FROM sensors WHERE id IN ("+ids+")");
    }
}
