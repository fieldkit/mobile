import {
    Observable,
    PropertyChangeData
} from "tns-core-modules/data/observable";
import { Zeroconf } from "nativescript-zeroconf";

const zeroconf = new Zeroconf("_fk._tcp");
const services = [];

export default class DiscoverStation {
    constructor() {
        zeroconf.on(
            Observable.propertyChangeEvent,
            data => {
                switch (data.propertyName.toString()) {
                    case "serviceFound": {
                        console.log("found service:", data.value.type, data.value.name, data.value.host, data.value.port);
                        services.push(data.value);
                        break;
                    }
                    case "serviceLost": {
                        console.log("lost service:", data.value.type, data.value.name);
                        break;
                    }
                    default: {
                        console.log(data.propertyName.toString() + " " + data.value.toString());
                        break;
                    }
                }
            },
            error => {
                console.log("propertyChangeEvent error", error);
            }
        );
    }

    startServiceDiscovery() {
        zeroconf.startServiceDiscovery();
    }

    stopServiceDiscovery() {
        zeroconf.stopServiceDiscovery();
        services = [];
    }
}
