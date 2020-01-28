import _ from 'lodash';
import { serializePromiseChain } from '../utilities';

export default class StationUpgrade {
	constructor(services) {
		this.services = services;
	}

	downloadFirmware() {
		return this.services.PortalInterface().listFirmware("fk-core")
			.then(firmware => {
				return firmware.firmwares.map(f => {
					const local = this.services.FileSystem().getFolder("firmware").getFile("fk-bundled-fkb-" + f.id + ".bin");
					return _.extend(f, {
						path: local.path
					});
				})
			})
			.then(firmwares => {
				return serializePromiseChain(firmwares, firmware => {
					return this.services.Database().addOrUpdateFirmware(firmware);
				}).then(_ => {
					const local = this.services.FileSystem().getFile(firmwares[0].path);
					if (!local.exists()) {
						console.log("downloading", firmwares[0]);
						return this.services.PortalInterface().downloadFirmware(firmwares[0].url, firmwares[0].path).then(() => {
							return firmwares[0];
						});
					}
					console.log("already have", firmwares[0]);
					return firmwares[0];
				});
			});
	}

	upgradeStation(url) {
		return this.services.QueryStation().uploadFirmware(station, firmware.path);
	}
}
