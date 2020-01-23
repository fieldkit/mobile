import * as geolocation from "nativescript-geolocation";
import { Accuracy } from "tns-core-modules/ui/enums";
import { promiseAfter } from '../utilities';

export class Coordinates {
	constructor(lat, lon) {
		if (lat && lat.latitude) {
			this.latitude = lat.latitude;
			this.longitude = lat.longitude;
		}
		else {
			this.latitude = lat || null;
			this.longitude = lon || null;
		}
	}

	valid() {
		if (this.latitude === null || this.longitude === null) {
			return false;
		}
		if (this.latitude > 90 || this.latitude < -90 || this.longitude > 180 || this.longitude < -180) {
			return false;
		}
		// TODO We need to find why this happens and fix it.
		if (this.latitude === 0 && this.longitude === 0) {
			return false;
		}
		return true;
	}
};

// Conservify's office in LA:
const defaultLocation = {
    latitude: 34.031803131103516,
    longitude: -118.27091979980469
}

export default class PhoneLocation {
	enableAndGetLocation() {
		return geolocation.isEnabled().then(isEnabled => {
			if (isEnabled) {
				if (false) {
					console.log("location delay for debugging");
					return promiseAfter(10000).then(() => {
						return this.getLocation();
					});
				}

				// TODO Remove this eventually.
				this.testAccuracies();

				return this.getLocation();
			} else {
				return geolocation.enableLocationRequest().then(() => {
					return this.getLocation();
				}, e => {
					return new Coordinates(defaultLocation);
				});
			}
		});
	}

	test(name, params) {
		const started = new Date();
		return geolocation
			.getCurrentLocation(params)
			.then(loc => {
				const done = new Date();
				const elapsed = done - started;
				console.log("location done", name, elapsed, loc.latitude, loc.longitude, loc.horizontalAccuracy);
			}, err => {
				const done = new Date();
				const elapsed = done - started;
				console.log("location failed", name, elapsed, err);
			});
	}

	testAccuracies() {
		const high20k = {
			desiredAccuracy: Accuracy.high,
			updateDistance: 10,
			maximumAge: 20000,
			timeout: 20000
		};

		const any20k = {
			desiredAccuracy: Accuracy.any,
			updateDistance: 10,
			maximumAge: 20000,
			timeout: 20000
		};

		const high2k = {
			desiredAccuracy: Accuracy.high,
			updateDistance: 10,
			maximumAge: 2000,
			timeout: 20000
		};

		const any2k = {
			desiredAccuracy: Accuracy.any,
			updateDistance: 10,
			maximumAge: 2000,
			timeout: 20000
		};

		return this.test('high20k', high20k).then(() => {
			return this.test('any20k', any20k).then(() => {
				return this.test('high2k', high2k).then(() => {
					return this.test('any2k', any2k).then(() => {
					});
				});
			});
		});
	}

	getLocation() {
		return geolocation
			.getCurrentLocation({
				desiredAccuracy: Accuracy.high,
				updateDistance: 10,
				maximumAge: 20000,
				timeout: 20000
			})
			.then(loc => {
				if (loc) {
					return new Coordinates(loc);
				}
				return new Coordinates(defaultLocation);
			}, e => {
				return new Coordinates(defaultLocation);
			});
	}
}
