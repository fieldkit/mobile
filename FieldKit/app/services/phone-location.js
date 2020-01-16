import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";

// Conservify's office in LA:
const defaultLocation = {
    latitude: 34.031803131103516,
    longitude: -118.27091979980469
}

export default class PhoneLocation {
    constructor() {
    }

    enableAndGetLocation() {
        return geolocation.isEnabled().then(isEnabled => {
            if (isEnabled) {
                return this.getLocation();
            } else {
                return geolocation.enableLocationRequest().then(
                    () => {
                        return this.getLocation();
                    },
                    e => {
                        // console.log("enableLocationRequest() error: " + (e.message || e));
                        return defaultLocation;
                    }
                );
            }
        });
    }

    getLocation() {
        return geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                updateDistance: 10,
                maximumAge: 20000,
                timeout: 20000
            })
            .then(
                loc => {
                    if (loc) {
                        return loc;
                    } else {
                        return defaultLocation;
                    }
                },
                e => {
                     // console.log("getlocation error: " + e.message);
                    return defaultLocation;
                }
            );
    }
}
