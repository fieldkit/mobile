import { Observable } from "tns-core-modules/data/observable";
import { promiseAfter, convertBytesToLabel } from "../utilities";
import Config from "../config";

export default class StationLogs extends Observable {
	constructor(discoverStation, queryStation) {
		super();
		this.discoverStation = discoverStation;
		this.queryStation = queryStation;
		this.stations = {};

		this.discoverStation.on(Observable.propertyChangeEvent, data => {
			switch (data.propertyName.toString()) {
			case this.discoverStation.StationFoundProperty: {
				console.log("FOUND");
				break;
			}
			case this.discoverStation.StationLostProperty: {
				console.log("LOST");
				break;
			}
			}
		});
	}
}
