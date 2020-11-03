import { Location } from "@nativescript/geolocation";

export interface QueryLocationParams {
    desiredAccuracy: number;
    updateDistance: number;
    maximumAge: number;
    timeout: number;
}

export class GeoLocation {
    public isEnabled(): Promise<boolean> {
        return Promise.resolve(true);
    }

    public getCurrentLocation(_params: QueryLocationParams): Promise<Location> {
        return Promise.resolve({
            latitude: 0,
            longitude: 0,
            horizontalAccuracy: 0,
            altitude: 0,
            verticalAccuracy: 0,
            speed: 0,
            timestamp: new Date(),
            direction: 0,
        });
    }

    public enableLocationRequest(): Promise<void> {
        return Promise.resolve();
    }
}
