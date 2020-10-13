export class GeoLocation {
    isEnabled() {
        return Promise.resolve(true);
    }

    getCurrentLocation(params) {
        return Promise.resolve({
            latitude: 0,
            longitude: 0,
            horizontalAccuracy: 0,
        });
    }

    enableLocationRequest() {
        return Promise.resolve();
    }
}
