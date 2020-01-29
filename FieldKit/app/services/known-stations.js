import _ from 'lodash';
import DomainServices from './domain-services';

export class Station {
	constructor(deviceId) {
		this.deviceId = deviceId;
		this.data = null;
		this.previousStatus = null;
	}

	id() {
		return this.deviceId;
	}

	name() {
		return this.data.name;
	}

	url() {
		return this.data.url;
	}

	location() {
		return new Coordinates(this.data);
	}

	connected() {
		return this.data.connected;
	}

	haveNewPhoneLocation(phone) {
		if (!this.data.connected) {
			console.log(this.data.name, 'ignoring disconnected');
			return Promise.resolve({ });
		}

		if (!phone.location.valid()) {
			return Promise.resolve({ });
		}

		if (this.previousStatus) {
			const statusLocation = new Coordinates(this.previousStatus.gps);
			if (statusLocation.valid()) {
				return Promise.resolve({ });
			}
		}

		return this.setLocation(phone.location);
	}

	haveNewStatus(status, phone) {
		this.previousStatus = status;

		const location = new Coordinates(status.gps);
		if (location.valid()) {
			return this.setLocation(location);
		}

		if (phone.location.valid()) {
			return this.setLocation(phone.location);
		}

		return Promise.resolve({});
	}

	setLocation(location) {
		// console.log(this.data.name, 'updating location', location);
		this.data.latitude = location.latitude;
		this.data.longitude = location.longitude;

		return DomainServices().updateStation(this);
	}
}

export class Phone {
	constructor(location) {
		this.location = location || new Coordinates();
	}
}

export class KnownStations {
	constructor() {
		this.stations = {};
	}

	get(lookup) {
		if (_.isString(lookup)) {
			return this.getByDeviceId(lookup);
		}
		if (_.isObject(lookup) && _.isString(lookup.deviceId)) {
			const station = this.getByDeviceId(lookup.deviceId)
			station.data = lookup;
			return station;
		}
		throw new Error("Unexpected lookup method", lookup)
	}

	getByDeviceId(deviceId) {
		if (this.stations[deviceId]) {
			return this.stations[deviceId];
		}
		return this.stations[deviceId] = new Station(deviceId);
	}

	connected() {
		return Object.values(this.stations).filter(s => s.connected());
	}
}

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
