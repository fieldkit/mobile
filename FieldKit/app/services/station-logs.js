import { BetterObservable } from "./rx";
import { promiseAfter, convertBytesToLabel } from "../utilities";
import Config from "../config";

export default class StationLogs extends BetterObservable {
    constructor(discoverStation, queryStation) {
        super();
        this.discoverStation = discoverStation;
        this.queryStation = queryStation;
        this.stations = {};

        this.discoverStation.on(BetterObservable.propertyChangeEvent, data => {
            switch (data.propertyName.toString()) {
                case this.discoverStation.StationFoundProperty: {
                    break;
                }
                case this.discoverStation.StationLostProperty: {
                    break;
                }
            }
        });
    }
}
