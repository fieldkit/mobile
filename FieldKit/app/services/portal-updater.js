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
                if (!yes) {
                    return Promise.resolve();
                }
                // retrieve stations
                return Services.Database()
                    .getAll()
                    .then(stations => {
                        return Promise.all(
                            stations.map(station => {
                                const params = {
                                    name: station.name,
                                    device_id: station.deviceId,
                                    status_json: station,
                                    status_pb: station.serializedStatus,
                                };
                                // update or add station
                                if (station.portalId) {
                                    return Services.PortalInterface()
                                        .updateStation(params, station.portalId)
                                        .then(() => {
                                            return Services.Database().setStationPortalError(station, "");
                                        })
                                        .catch(error => {
                                            return Services.Database().setStationPortalError(station, error.response.status);
                                        });
                                } else {
                                    return Services.PortalInterface()
                                        .addStation(params)
                                        .then(result => {
                                            station.portalId = result.id;
                                            Services.Database().setStationPortalId(station);
                                        });
                                }
                            })
                        );
                    });
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
