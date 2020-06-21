import { BetterObservable } from "./rx";
import { Accuracy } from "tns-core-modules/ui/enums";
import { GeoLocation } from "../wrappers/geolocation";
import { promiseAfter } from "../utilities";
import { Coordinates } from "./known-stations";
import * as MutationTypes from "../store/mutations";
import * as ActionTypes from "../store/actions";
import Config from "../config";

const log = Config.logger("PhoneLocation");

// Twin Peaks East in Angeles National Forest
const defaultLocation = {
    latitude: 34.3318104,
    longitude: -118.0730372,
};

export default class PhoneLocation extends BetterObservable {
    constructor(store) {
        super();
        this._store = store;
        this._geolocation = new GeoLocation();
    }

    enableAndGetLocation() {
        return this._geolocation
            .isEnabled()
            .then(isEnabled => {
                if (isEnabled) {
                    // TODO Remove this eventually.
                    this.testAccuracies();

                    return this.getLocation();
                } else {
                    return this._geolocation.enableLocationRequest().then(
                        v => this.getLocation(),
                        e => new Coordinates(defaultLocation)
                    );
                }
            })
            .then(location => {
                if (Config.env.jacob) {
                    this._store.commit(MutationTypes.PHONE_LOCATION, location);
                }

                this._keepLocationUpdated();
                return location;
            });
    }

    _keepLocationUpdated() {
        return this._geolocation
            .isEnabled()
            .then(enabled => {
                if (enabled) {
                    return this.getLocation()
                        .then(location => {
                            if (Config.env.jacob) {
                                return Promise.resolve(this._store.commit(MutationTypes.PHONE_LOCATION, location)).then(() => {
                                    return location;
                                });
                            }
                            return location;
                        })
                        .then(location => {
                            return this.publish(location);
                        });
                }
                return Promise.resolve(defaultLocation);
            })
            .then(l => {
                promiseAfter(10000).then(() => {
                    return this._keepLocationUpdated();
                });

                return l;
            });
    }

    test(name, params) {
        const started = new Date();
        return this._geolocation.getCurrentLocation(params).then(
            loc => {
                const done = new Date();
                const elapsed = done - started;
                log.info("done", name, elapsed, loc.latitude, loc.longitude, loc.horizontalAccuracy);
            },
            err => {
                const done = new Date();
                const elapsed = done - started;
                log.info("failed", name, elapsed, err);
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
        return this._geolocation
            .getCurrentLocation({
                desiredAccuracy: Accuracy.high,
                updateDistance: 10,
                maximumAge: 20000,
                timeout: 20000,
            })
            .then(
                l => new Coordinates(l || defaultLocation),
                e => new Coordinates(defaultLocation)
            );
    }
}
