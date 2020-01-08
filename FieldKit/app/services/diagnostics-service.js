import * as utils from "tns-core-modules/utils/utils";
import * as platform from "tns-core-modules/platform";
import { Folder, path, File, knownFolders } from "tns-core-modules/file-system";
import { getLogsAsString } from '../lib/logging';
import Services from "./services";

function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}

export default class Diagnostics {
	constructor() {
		this.baseUrl = "https://code.conservify.org/diagnostics"
	}

	upload() {
		const id = uuidv4();

		console.log("diagnostics: starting", id)

		return this._queryLogs().then((allLogs) => {
			console.log("diagnostics: uploading station logs", allLogs.length);
			return this._uploadAllLogs(id, allLogs);
		}).then(() => {
			console.log("diagnostics: uploading app logs");
			return this._uploadAppLogs(id);
		}).then(() => {
			console.log("diagnostics: uploading database");
			return this._uploadDatabase(id);
		}).then(reference => {
			console.log("diagnostics: done", id)
			return {
				reference: reference,
				id: id,
			};
		});
	}

	_queryLogs() {
		return Services.DiscoverStation().getConnectedStations().then(stations => {
			console.log("connected", stations);

			return Promise.all(Object.values(stations).map(station => {
				return Services.QueryStation().getStatus(station.url).then(status => {
					return Services.QueryStation().queryLogs(station.url).then(logs => {
						return {
							status: status,
							station: station,
							logs: logs
						};
					});
				});
			}))
		});
	}

	_uploadAllLogs(id, allLogs) {
		return Promise.all(allLogs.map(row => {
			return this._uploadLogs(id, row);
		}));
	}

	_uploadAppLogs(id) {
		return Services.Conservify().text({
			method: "POST",
			url: this.baseUrl + "/" + id + "/app.txt",
			body: getLogsAsString(),
		});
	}

	_uploadLogs(id, logs) {
		return Services.Conservify().text({
			method: "POST",
			url: this.baseUrl + "/" + id + "/station.json",
			body: JSON.stringify(logs.status),
		}).then(() => {
			return Services.Conservify().text({
				method: "POST",
				url: this.baseUrl + "/" + id + "/logs.txt",
				body: logs.logs,
			});
		});
	}

	_uploadDatabase(id) {
		return this._recurse(knownFolders.documents()).then(() => {
			const name = "fieldkit.sqlite3";
			const path = this._getDatabasePath(name);

			console.log("diagnostics", path);

			return Services.Conservify().upload({
				method: "POST",
				url: this.baseUrl + "/" + id + "/" + name,
				path: path,
			}).then(response => {
				return response.body;
			});
		});
	}

	_getDatabasePath(name) {
		if (platform.isAndroid) {
			const context = utils.ad.getApplicationContext();
			return context.getDatabasePath(name).getAbsolutePath();
		}

		const folder = fs.knownFolders.documents().path;
		return folder + "/" + name;
	}

	_recurse(f) {
		return f.getEntities().then(entities => {
			return Promise.all(entities.map(e => {
				if (Folder.exists(e.path)) {
					// console.log("dir", e.path);
					return this._recurse(Folder.fromPath(e.path))
				}
				else {
					// console.log("file", e.path);
				}
			}));
		});
	}
}
