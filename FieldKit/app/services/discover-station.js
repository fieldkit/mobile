import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";
import { Zeroconf } from "nativescript-zeroconf";
import DatabaseInterface from "./db-interface";

const dbInterface = new DatabaseInterface();

class Station {
    constructor(info) {
        this.scheme = "http";
        this.type = info.type;
        this.name = info.name;
        this.host = info.host;
        this.port = info.port;
        this.url = this.scheme + "://" + this.host + ":" + this.port + "/fk/v1";
    }
}

export default class DiscoverStation {
    constructor(queryStation) {
        this.zeroconf_ = new Zeroconf("_fk._tcp");
        this.queryStation_ = queryStation;
        this.stations_ = {};
    }

    startServiceDiscovery() {
        this.zeroconf_.on(
            Observable.propertyChangeEvent,
            data => {
                switch (data.propertyName.toString()) {
                    case "serviceFound": {
                        this.stationFound(data.value);
                        break;
                    }
                    case "serviceLost": {
                        this.stationLost(data.value);
                        break;
                    }
                    default: {
                        console.log(
                            data.propertyName.toString() +
                                " " +
                                data.value.toString()
                        );
                        break;
                    }
                }
            },
            error => {
                console.log("propertyChangeEvent error", error);
            }
        );
        this.zeroconf_.startServiceDiscovery();
    }

    stopServiceDiscovery() {
        this.zeroconf_.stopServiceDiscovery();
        this.stations_ = {};
    }

    stationFound(info) {
        console.log(
            "found service:",
            info.type,
            info.name,
            info.host,
            info.port
        );

        const key = this.makeKey(info);
        const station = new Station(info);
        this.stations_[key] = station;

        // NOTE: This is just here to demonstrate how things flow together.
        dbInterface.checkForStation(station.url);
    }

    stationLost(info) {
        console.log("lost service:", info.type, info.name);
        const key = this.makeKey(info);
        delete this.stations_[key];
    }

    makeKey(station) {
        return station.name + station.type;
    }
}
