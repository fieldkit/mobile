import { BetterObservable } from "./rx";
import { Accuracy } from "tns-core-modules/ui/enums";
import { GeoLocation } from "../wrappers/geolocation";
import { promiseAfter, unixNow } from "../utilities";
import * as MutationTypes from "../store/mutations";
import { PhoneLocation } from "../store/types";
import Config from "../config";

const log = Config.logger("PhoneLocation");

interface HasPublish {
    publish(value: any): Promise<any>;
}

export default class PhoneLocationWatcher extends BetterObservable {
    _store: any;
    _geolocation: any;

    constructor(store) {
        super();
        this._store = store;
        this._geolocation = new GeoLocation();
    }

    enableAndGetLocation() {
        return this._geolocation
            .isEnabled()
            .then(isEnabled => {
                if (!isEnabled) {
                    return this._geolocation.enableLocationRequest();
                }
                // TODO Remove this eventually.
                this.testAccuracies();
                return true;
            })
            .then(() => {
                return this._keepLocationUpdated();
            });
    }

    _keepLocationUpdated() {
        return this._geolocation
            .isEnabled()
            .then(enabled => {
                if (!enabled) {
                    return PhoneLocation.TwinPeaksEastLosAngelesNationalForest;
                }
                return this.getLocation();
            })
            .then(location => {
                if (Config.env.jacob) {
                    this._store.commit(MutationTypes.PHONE_LOCATION, location);
                }
                return location;
            })
            .then(location => (<HasPublish>(<unknown>this)).publish(location))
            .then(location => {
                promiseAfter(10000).then(() => {
                    return this._keepLocationUpdated();
                });

                return location;
            });
    }

    test(name, params) {
        const started = new Date();
        return this._geolocation.getCurrentLocation(params).then(
            loc => {
                const done = new Date();
                const elapsed = done.getTime() - started.getTime();
                log.info("done", name, elapsed, loc.latitude, loc.longitude, loc.horizontalAccuracy);
            },
            err => {
                const done = new Date();
                const elapsed = done.getTime() - started.getTime();
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
                l => new PhoneLocation(l.latitude, l.longitude, unixNow()),
                e => PhoneLocation.TwinPeaksEastLosAngelesNationalForest
            );
    }
}
