import { Enums } from "@nativescript/core";
import { GeoLocation, QueryLocationParams } from "@/wrappers/geolocation";
import { MutationTypes, CommonLocations, PhoneLocation } from "@/store";
import { OurStore } from "@/store/our-store";
import { debug, promiseAfter, unixNow, zoned } from "@/lib";
import Config from "@/config";

const log = Config.logger("PhoneLocation");

export default class PhoneLocationWatcher {
    private store: OurStore;
    private geolocation: GeoLocation;

    constructor(store: OurStore) {
        this.store = store;
        this.geolocation = new GeoLocation();
    }

    public async enableAndGetLocation(): Promise<void> {
        const started = new Date();

        debug.log("phone-location:enable");

        return await this.geolocation
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
                debug.log("phone-location:ready", elapsed);
            });
    }

    private async keepLocationUpdated(): Promise<void> {
        return await this.geolocation
            .isEnabled()
            .then((enabled: boolean): Promise<PhoneLocation> => {
                if (!enabled) {
                    return Promise.resolve(CommonLocations.TwinPeaksEastLosAngelesNationalForest);
                }
                return this.getLocation();
            })
            .then((location: PhoneLocation) => {
                return zoned({}, async () => {
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

    private async test(name: string, params: QueryLocationParams): Promise<void> {
        const started = new Date();
        await this.geolocation.getCurrentLocation(params).then(
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

    public async testAccuracies(): Promise<void> {
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

        await this.test("high20k", high20k).then(() => {
            return this.test("any20k", any20k).then(() => {
                return this.test("high2k", high2k).then(() => {
                    return this.test("any2k", any2k).then(() => Promise.resolve());
                });
            });
        });
    }

    public async getLocation(): Promise<PhoneLocation> {
        return await this.geolocation
            .getCurrentLocation({
                desiredAccuracy: Enums.Accuracy.high,
                updateDistance: 10,
                maximumAge: 20000,
                timeout: 20000,
            })
            .then(
                (l) => new PhoneLocation(l.latitude, l.longitude, unixNow()),
                (error) => {
                    debug.log(`error getting location`, error);
                    return CommonLocations.TwinPeaksEastLosAngelesNationalForest;
                }
            );
    }
}
