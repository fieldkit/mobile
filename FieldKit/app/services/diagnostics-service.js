import * as utils from 'tns-core-modules/utils/utils'
import * as platform from 'tns-core-modules/platform'
import { Folder, path, File, knownFolders } from 'tns-core-modules/file-system'
import { copyLogs } from '../lib/logging'
import { serializePromiseChain, getPathTimestamp } from '../utilities'

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export default class Diagnostics {
    constructor(services) {
        this.services = services
        this.baseUrl = 'https://code.conservify.org/diagnostics'
    }

    upload() {
        const id = uuidv4()

        console.log('diagnostics: starting', id)

        return this._uploadDeviceInformation(id)
            .then(() => {
                console.log('diagnostics: querying logs')
                return this._queryLogs()
            })
            .then(allLogs => {
                console.log('diagnostics: uploading station logs', allLogs.length)
                return this._uploadAllLogs(id, allLogs)
            })
            .then(() => {
                console.log('diagnostics: uploading app logs')
                return this._uploadAppLogs(id)
            })
            .then(() => {
                console.log('diagnostics: uploading database')
                return this._uploadDatabase(id)
            })
            .then(reference => {
                return this._uploadArchived().then(() => {
                    console.log('diagnostics: done', id)
                    return {
                        reference: reference,
                        id: id,
                    }
                })
            })
    }

    _backupDatabase(folder) {
        return Promise.resolve()
    }

    _uploadDeviceInformation(id) {
        const device = platform.device

        const info = {
            deviceType: device.deviceType,
            language: device.language,
            manufacturer: device.manufacturer,
            model: device.model,
            os: device.os,
            osVersion: device.osVersion,
            region: device.region,
            sdkVersion: device.sdkVersion,
            uuid: device.uuid,
        }

        return this.services.Conservify().text({
            method: 'POST',
            url: this.baseUrl + '/' + id + '/device.json',
            body: JSON.stringify(info),
            path: path,
        })
    }

    _uploadArchived() {
        const folder = this._getDiagnosticsFolder()

        return this._getAllFiles(folder).then(files => {
            console.log('uploading', files)
            return serializePromiseChain(files, (path, index) => {
                const relative = path.replace(folder.path, '')
                return this.services
                    .Conservify()
                    .upload({
                        method: 'POST',
                        url: this.baseUrl + relative,
                        path: path,
                    })
                    .then(() => {
                        return File.fromPath(path).remove()
                    })
            })
        })
    }

    save() {
        return Promise.resolve().then(() => {
            const folder = this._getNewFolder()

            return Promise.all([
                copyLogs(folder.getFile('app.txt')),
                this._backupDatabase(folder),
                this._queryLogs().then(allLogs => {
                    return Promise.all(
                        allLogs.map(row => {
                            return Promise.all([
                                folder.getFile(row.name + '.json').writeText(JSON.stringify(row.status)),
                                folder.getFile(row.name + '.txt').writeText(row.logs),
                            ])
                        })
                    )
                }),
            ])
        })
    }

    _queryLogs() {
        return this.services
            .DiscoverStation()
            .getConnectedStations()
            .then(stations => {
                console.log('connected', stations)

                return Promise.all(
                    Object.values(stations).map(station => {
                        return this._queryStationLogs(station)
                    })
                ).then(all => {
                    return all
                })
            })
    }

    _queryStationLogs(station) {
        return this.services
            .QueryStation()
            .getStatus(station.url)
            .catch(_ => {
                return null
            })
            .then(status => {
                return this.services
                    .QueryStation()
                    .queryLogs(station.url)
                    .then(logs => {
                        const name = status.status.identity.deviceId
                        return {
                            name: name,
                            status: status,
                            station: station,
                            logs: logs,
                        }
                    })
            })
    }

    _uploadAllLogs(id, allLogs) {
        return Promise.all(
            allLogs.map(row => {
                return this._uploadLogs(id, row)
            })
        )
    }

    _uploadAppLogs(id) {
        const copy = this._getDiagnosticsFolder().getFile('uploading.txt')
        return copyLogs(copy).then(() => {
            return this.services.Conservify().upload({
                method: 'POST',
                url: this.baseUrl + '/' + id + '/app.txt',
                path: copy.path,
            })
        })
    }

    _uploadLogs(id, logs) {
        return this.services
            .Conservify()
            .text({
                method: 'POST',
                url: this.baseUrl + '/' + id + '/' + logs.name + '.json',
                body: JSON.stringify(logs.status),
            })
            .then(() => {
                return this.services.Conservify().text({
                    method: 'POST',
                    url: this.baseUrl + '/' + id + '/' + logs.name + '.txt',
                    body: logs.logs,
                })
            })
    }

    _uploadDatabase(id) {
        console.log('getting database path')

        const path = this._getDatabasePath('fieldkit.sqlite3')

        console.log('diagnostics', path)

        return this.services
            .Conservify()
            .upload({
                method: 'POST',
                url: this.baseUrl + '/' + id + '/fk.db',
                path: path,
            })
            .then(response => {
                return response.body
            })
    }

    _getDatabasePath(name) {
        try {
            if (platform.isAndroid) {
                const context = utils.ad.getApplicationContext()
                return context.getDatabasePath(name).getAbsolutePath()
            }

            const folder = knownFolders.documents().path
            return folder + '/' + name
        } catch (e) {
            console.log('error getting path', e)
            return null
        }
    }

    _recurse(f, depth, callback) {
        return f.getEntities().then(entities => {
            return Promise.all(
                entities.map(e => {
                    if (Folder.exists(e.path)) {
                        return this._recurse(Folder.fromPath(e.path), depth + 1, callback)
                    } else {
                        callback(depth, e.path)
                    }
                })
            )
        })
    }

    _getAllFiles(f) {
        const files = []

        return this._recurse(f, 0, (depth, path) => {
            if (depth > 0) {
                files.push(path)
            } else {
                console.log('ignoring', depth, path)
            }
        }).then(() => {
            return files
        })
    }

    _getDiagnosticsFolder() {
        return knownFolders.documents().getFolder('diagnostics')
    }

    _getNewFolder() {
        const id = uuidv4()
        return this._getDiagnosticsFolder().getFolder(id)
    }
}
