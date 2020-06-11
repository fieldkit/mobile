import { Accuracy } from "tns-core-modules/ui/enums";
import { GeoLocation } from "../wrappers/geolocation";
import { promiseAfter } from "../utilities";
import { Coordinates } from "./known-stations";
import Config from "../config";

const log = Config.logger("PhoneLocation");

// Twin Peaks East in Angeles National Forest
const defaultLocation = {
    latitude: 34.3318104,
    longitude: -118.0730372,
};

export default class PhoneLocation {
    constructor() {
        this.geolocation = new GeoLocation();
    }

    enableAndGetLocation() {
        return this.geolocation.isEnabled().then(isEnabled => {
            if (isEnabled) {
                // TODO Remove this eventually.
                this.testAccuracies();

                return this.getLocation();
            } else {
                return this.geolocation.enableLocationRequest().then(
                    v => this.getLocation(),
                    e => new Coordinates(defaultLocation)
                );
            }
        });
    }

    test(name, params) {
        const started = new Date();
        return this.geolocation.getCurrentLocation(params).then(
            loc => {
                const done = new Date();
                const elapsed = done - started;
                log.info("location done", name, elapsed, loc.latitude, loc.longitude, loc.horizontalAccuracy);
            },
            err => {
                const done = new Date();
                const elapsed = done - started;
                log.info("location failed", name, elapsed, err);
            }
        );
    }

    testAccuracies() {
        const high20k = {
            desiredAccuracy: Accuracy.high,
            updateDistance: 10,
            maximumAge: 20000,
            timeout: 20000,
        };

        const any20k = {
            desiredAccuracy: Accuracy.any,
            updateDistance: 10,
            maximumAge: 20000,
            timeout: 20000,
        };

        const high2k = {
            desiredAccuracy: Accuracy.high,
            updateDistance: 10,
            maximumAge: 2000,
            timeout: 20000,
        };

        const any2k = {
            desiredAccuracy: Accuracy.any,
            updateDistance: 10,
            maximumAge: 2000,
            timeout: 20000,
        };

        return this.test("high20k", high20k).then(() => {
            return this.test("any20k", any20k).then(() => {
                return this.test("high2k", high2k).then(() => {
                    return this.test("any2k", any2k).then(() => {});
                });
            });
        });
    }

    getLocation() {
        return this.geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                updateDistance: 10,
                maximumAge: 20000,
                timeout: 20000,
            })
            .then(
                location => {
                    if (location) {
                        return new Coordinates(location);
                    }
                    return new Coordinates(defaultLocation);
                },
                e => new Coordinates(defaultLocation)
            );
    }
}
