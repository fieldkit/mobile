import _ from 'lodash';
import { serializePromiseChain } from '../utilities';

function transformProgress(callback, fn) {
	if (_.isFunction(callback)) {
		return (total, copied, info) => {
			callback({
				progress: fn(copied / total * 100.0)
			})
		};
	}
	return () => {
	};
}

export default class StationUpgrade {
	constructor(services) {
		this.services = services;
	}

	downloadFirmware(progressCallback, force) {
		return this.services.PortalInterface().listFirmware("fk-core")
			.then(firmware => {
				console.log(firmware)
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
				}).then(() => {
					const local = this.services.FileSystem().getFile(firmwares[0].path);
					if (!local.exists() || local.size == 0 || force === true) {
						console.log("downloading", firmwares[0]);

						const downloadProgress = transformProgress(progressCallback, p => p);

						return this.services.PortalInterface().downloadFirmware(firmwares[0].url, firmwares[0].path, downloadProgress).then(() => {
							return firmwares[0];
						});
					}
					console.log("already have", firmwares[0]);
					return firmwares[0];
				});
			});
	}

	upgradeStation(url, progressCallback) {
		console.log("upgrade", url);

		return this.haveFirmware().then(yes => {
			if (!yes) {
				return Promise.reject("missingFirmware");
			}
			return this.services.StationMonitor().getKnownStations().then(knownStations => {
				return this.services.Database().getLatestFirmware().then(firmware => {
					console.log("firmware", firmware);

					const uploadProgress = transformProgress(progressCallback, p => p);

					return this.services.QueryStation().uploadFirmware(url, firmware.path, uploadProgress);
				});
			});
		});
	}

	haveFirmware() {
		return this.services.Database().getLatestFirmware().then(firmware => {
			const local = this.services.FileSystem().getFile(firmware.path);
			if (!local.exists() || local.size == 0) {
				return false;
			}
			return true;
		});
	}
}
