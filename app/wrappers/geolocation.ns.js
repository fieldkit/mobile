import * as geolocation from "@nativescript/geolocation";

export class GeoLocation {
    isEnabled() {
        return geolocation.isEnabled();
    }

    getCurrentLocation(params) {
        return geolocation.getCurrentLocation(params);
    }

    enableLocationRequest() {
        return geolocation.enableLocationRequest();
    }
}
