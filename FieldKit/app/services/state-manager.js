export default class StateManager {
    constructor(databaseInterface, queryStation) {
        this.databaseInterface = databaseInterface;
        this.queryStation = queryStation;
    }

    renameStation(station, newName) {
        return this.databaseInterface.setStationName(station).then(() => {
            return this.queryStation.configureName(station.url, newName);
        });
    }
}
