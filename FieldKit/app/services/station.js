import _ from 'lodash';
import { Coordinates } from './phone-location';
import Services from './services';

export class Station {
	constructor(station) {
		this.station = station;
		this.location = new Coordinates(station);
	}

	haveNewPhoneLocation(phoneLocation) {
		if (!this.station.connected) {
			console.log('ignoring disconnected station', this.station.name);
			return Promise.resolve({ });
		}

		if (!phoneLocation.valid()) {
			return Promise.resolve({ });
		}

		console.log('updating location', this.station.name);

		this.station.latitude = phoneLocation.latitude;
		this.station.longitude = phoneLocation.longitude;

		return Services.Database().setStationLocationCoordinates(this.station).then(() => {
			const portalId = this.station.portalId;
			if (!portalId) {
				console.log("skip portal update, no portal id");
				return {};
			}

			console.log("updating portal");
			return Services.PortalInterface().isAvailable().then(yes => {
				if (!yes) {
					return {};
				}

				const params = {
					name: this.station.name,
					device_id: this.station.deviceId,
					status_json: this.station
				};

				return Services.PortalInterface().updateStation(params, portalId).then(() => {
					console.log("done");
					return { };
				});
			});
		}).catch(error => {
			console.log("error", error);
			return Promise.reject({ });
		});
	}

	haveNewStatus(status) {
		return Promise.resolve({});
	}
}
