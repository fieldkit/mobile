import _ from 'lodash';
import { serializePromiseChain } from '../utilities';
import Services from './services';
import FileSystem from '../wrappers/file-system';

export default class StationUpgrade {
	constructor(fs) {
		this.fs = fs;
	}

	downloadFirmware() {
		return Services.PortalInterface().listFirmware("fk-core")
			.then(firmware => {
				return firmware.firmwares.map(f => {
					const local = this.fs.getFolder("firmware").getFile("fk-bundled-fkb-" + f.id + ".bin");
					return _.extend(f, {
						path: local.path
					});
				})
			})
			.then(firmwares => {
				return serializePromiseChain(firmwares, firmware => {
					return Services.Database().addOrUpdateFirmware(firmware);
				}).then(_ => {
					const local = this.fs.getFile(firmwares[0].path);
					if (!local.exists()) {
						console.log("downloading", firmwares[0]);
						return Services.PortalInterface().downloadFirmware(firmwares[0].url, firmwares[0].path).then(() => {
							return firmwares[0];
						});
					}
					console.log("already have", firmwares[0]);
					return firmwares[0];
				});
			});
	}

	compareVersions() {
		return this.downloadFirmware().then(firmware => {
			return Services.StationMonitor().getMyStations().then(myStations => {
				return myStations.connected().filter(s => {
					// return s.name().indexOf("Stingray") >= 0;
					return true;
				});
			}).then(stations => {
				return serializePromiseChain(stations, station => {
					console.log("upgrading", station.id(), station.name())

					return Services.QueryStation().uploadFirmware(station.url(), firmware.path);
				})
			})
		});
	}
}
