import Services from "./services";

// This is a very narrow set of operations that the domain/object
// layer can use and make for easy points for automated tests to hook
// into.
class DomainServices {
	constructor() {
		this.previous = {};
		console.log("DomainServices", "constructor");
	}

	updateStation(station) {
		const data = station.data;
		const previous = this.previous[data.deviceId];

		if (JSON.stringify(previous) == JSON.stringify(data)) {
			// console.log(data.name, "skip noop update");
			return Promise.resolve();
		}

		console.log(data.name, "updating local db");
		return Services.Database()
			.setStationLocationCoordinates(data)
			.then(() => {
				this.previous[data.deviceId] = data;
				console.log(data.name, "done");
				return {};
			})
			.catch(error => {
				console.log(data.name, "error", error);
				return Promise.reject(error);
			});
	}
}

let instance = null;

export default function() {
	if (instance) {
		return instance;
	}
	return (instance = new DomainServices());
}
