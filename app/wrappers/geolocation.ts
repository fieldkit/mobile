import { isEnabled, getCurrentLocation, enableLocationRequest, Location } from "@nativescript/geolocation";

export interface QueryLocationParams {
    desiredAccuracy: number;
    updateDistance: number;
    maximumAge: number;
    timeout: number;
}

export class GeoLocation {
    public isEnabled(): Promise<boolean> {
        return isEnabled();
    }

    public getCurrentLocation(params: QueryLocationParams): Promise<Location> {
        return getCurrentLocation(params);
    }

    public enableLocationRequest(): Promise<void> {
        return enableLocationRequest();
    }
}
