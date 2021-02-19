import { Enums } from "@nativescript/core";
import { GeoLocation, QueryLocationParams } from "@/wrappers/geolocation";
import { promiseAfter, unixNow } from "@/utilities";
import { MutationTypes, CommonLocations, PhoneLocation } from "@/store";
import { Store } from "@/store/our-store";
import { zoned } from "@/lib/zoning";
import Config from "@/config";

const log = Config.logger("PhoneLocation");

export default class PhoneLocationWatcher {
    private store: Store;
    private geolocation: GeoLocation;

    constructor(store: Store) {
        this.store = store;
        this.geolocation = new GeoLocation();
    }

    public enableAndGetLocation(): Promise<void> {
        const started = new Date();

        console.log("phone-location:enable");

        return this.geolocation
            .isEnabled()
            .then((enabled: boolean) => {
                if (!enabled) {
                    return this.geolocation.enableLocationRequest();
                }
                // TODO Remove this eventually.
                void this.testAccuracies();
                return;
            })
            .then(() => this.keepLocationUpdated())
            .then(() => {
                const now = new Date();
                const elapsed = now.getTime() - started.getTime();
                console.log("phone-location:ready", elapsed);
            });
    }

    private keepLocationUpdated(): Promise<void> {
        return this.geolocation
            .isEnabled()
            .then(
                (enabled: boolean): Promise<PhoneLocation> => {
                    if (!enabled) {
                        return Promise.resolve(CommonLocations.TwinPeaksEastLosAngelesNationalForest);
                    }
                    return this.getLocation();
                }
            )
            .then((location: PhoneLocation) => {
                return zoned(async () => {
                    this.store.commit(MutationTypes.PHONE_LOCATION, location);
                    await Promise.resolve();
                });
            })
            .then(() => {
                void promiseAfter(10000).then(() => {
                    return this.keepLocationUpdated();
                });
                return;
            });
    }

    private test(name: string, params: QueryLocationParams): Promise<void> {
        const started = new Date();
        return this.geolocation.getCurrentLocation(params).then(
            (loc) => {
                const done = new Date();
                const elapsed = done.getTime() - started.getTime();
                log.info("done", name, elapsed, loc.latitude, loc.longitude, loc.horizontalAccuracy);
            },
            (err) => {
                const done = new Date();
                const elapsed = done.getTime() - started.getTime();
                log.info("failed", name, elapsed, err);
            }
        );
    }

    public testAccuracies(): Promise<void> {
        const high20k = {
            desiredAccuracy: Enums.Accuracy.high,
            updateDistance: 10,
            maximumAge: 20000,
            timeout: 20000,
        };

        const any20k = {
            desiredAccuracy: Enums.Accuracy.any,
            updateDistance: 10,
            maximumAge: 20000,
            timeout: 20000,
        };

        const high2k = {
            desiredAccuracy: Enums.Accuracy.high,
            updateDistance: 10,
            maximumAge: 2000,
            timeout: 20000,
        };

        const any2k = {
            desiredAccuracy: Enums.Accuracy.any,
            updateDistance: 10,
            maximumAge: 2000,
            timeout: 20000,
        };

        return this.test("high20k", high20k).then(() => {
            return this.test("any20k", any20k).then(() => {
                return this.test("high2k", high2k).then(() => {
                    return this.test("any2k", any2k).then(() => Promise.resolve());
                });
            });
        });
    }

    public getLocation(): Promise<PhoneLocation> {
        return this.geolocation
            .getCurrentLocation({
                desiredAccuracy: Enums.Accuracy.high,
                updateDistance: 10,
                maximumAge: 20000,
                timeout: 20000,
            })
            .then(
                (l) => new PhoneLocation(l.latitude, l.longitude, unixNow()),
                (error) => {
                    console.log(`error getting location`, error);
                    return CommonLocations.TwinPeaksEastLosAngelesNationalForest;
                }
            );
    }
}
