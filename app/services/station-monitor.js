import _ from "lodash";
import { BetterObservable } from "./rx";
import { promiseAfter, convertBytesToLabel } from "../utilities";
import { Coordinates, Phone, KnownStations } from "./known-stations";
import Config from "../config";

const log = Config.logger("StationMonitor");

export default class StationMonitor extends BetterObservable {
    constructor(discoverStation, dbInterface, queryStation, phoneLocation) {
        super();
        log.info("StationMonitor ctor");
        this.dbInterface = dbInterface;
    }

    start() {
        return Promise.all([]);
    }

    getStations() {
        return this.dbInterface.removeNullIdModules().then(() => this.dbInterface.getAll());
    }

    getStationReadings(station) {
        return [];
    }

    startLiveReadings(address) {
        log.info("startLiveReadings");
    }

    stopLiveReadings(address) {
        log.info("stopLiveReadings");
    }

    subscribeAll(receiver) {
        log.info("subscribeAll");
    }

    unsubscribeAll(receiver) {
        log.info("unsubscribeAll");
    }
}
