import Services from "./services";

class PortalUpdater {
    constructor() {
        console.log("PortalUpdater", "constructor");
    }

    start() {
        setInterval(this.addOrUpdateStations, 60000);
    }

    addOrUpdateStations() {
        Services.PortalInterface()
            .isAvailable()
            .then(yes => {
                if (yes) {
                    // retrieve stations
                    Services.Database()
                        .getAll()
                        .then(stations => {
                            stations.map(station => {
                                const params = {
                                    name: station.name,
                                    device_id: station.deviceId,
                                    status_json: station,
                                    status_pb: station.serializedStatus,
                                };
                                // update or add station
                                if (station.portalId) {
                                    Services.PortalInterface()
                                        .updateStation(params, station.portalId)
                                        .then(() => {
                                            Services.Database().setStationPortalError(station, "");
                                        })
                                        .catch(error => {
                                            Services.Database().setStationPortalError(station, error.response.status);
                                        });
                                } else {
                                    Services.PortalInterface()
                                        .addStation(params)
                                        .then(result => {
                                            station.portalId = result.id;
                                            Services.Database().setStationPortalId(station);
                                        });
                                }
                            });
                        });
                }
            });
    }
}

let instance = null;

export default function() {
    if (instance) {
        return instance;
    }
    return (instance = new PortalUpdater());
}
