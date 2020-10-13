import { isEnabled, getCurrentLocation, enableLocationRequest } from "@nativescript/geolocation";

export class GeoLocation {
    public isEnabled() {
        return isEnabled();
    }

    public getCurrentLocation(params: any) {
        return getCurrentLocation(params);
    }

    public enableLocationRequest() {
        return enableLocationRequest();
    }
}
