import _ from 'lodash';
import { Coordinates } from './phone-location';
import DomainServices from './domain-services';

export class Station {
	constructor(deviceId) {
		this.deviceId = deviceId;
		this.data = null;
	}

	location() {
		return new Coordinates(this.data);
	}

	haveNewPhoneLocation(phone) {
		if (!this.data.connected) {
			console.log(this.data.name, 'ignoring disconnected');
			return Promise.resolve({ });
		}

		if (!phone.location.valid()) {
			return Promise.resolve({ });
		}

		return this.setLocation(phone.location);
	}

	haveNewStatus(status, phone) {
		const location = new Coordinates(status.status);
		if (location.valid()) {
			return this.setLocation(location);
		}

		if (phone.location.valid()) {
			return this.setLocation(phone.location);
		}

		return Promise.resolve({});
	}

	setLocation(location) {
		console.log(this.data.name, 'updating location', location);
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

export class MyStations {
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
}
