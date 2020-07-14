"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var conservify_common_1 = require("./conservify.common");
var application_1 = require("tns-core-modules/application");
function toJsHeaders(headers) {
    var jsHeaders = {};
    var iter = headers.entrySet().iterator();
    while (iter.hasNext()) {
        var entry = iter.next();
        var key = entry.getKey();
        jsHeaders[key.toLowerCase()] = entry.getValue();
    }
    return jsHeaders;
}
var OpenedFile = (function () {
    function OpenedFile(cfy, file) {
        this.cfy = cfy;
        this.fs = cfy.fileSystem;
        this.file = file;
    }
    OpenedFile.prototype.info = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var token = _this.fs.newToken();
            _this.file.readInfo(token);
            _this.cfy.active[token] = {
                resolve: resolve,
                reject: reject,
            };
        });
    };
    OpenedFile.prototype.delimited = function (listener) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var token = _this.fs.newToken();
            var options = new org.conservify.data.ReadOptions();
            options.setBatchSize(10);
            _this.file.readDelimited(token, options);
            _this.cfy.active[token] = {
                listener: listener,
                resolve: resolve,
                reject: reject,
            };
        });
    };
    return OpenedFile;
})();
var Conservify = (function (_super) {
    __extends(Conservify, _super);
    function Conservify(discoveryEvents, logger) {
        var _this = _super.call(this) || this;
        _this.logger = logger || console.log;
        _this.active = {};
        _this.networkStatus = null;
        _this.started = null;
        _this.discoveryEvents = discoveryEvents;
        return _this;
    }
    Conservify.prototype.start = function (serviceType) {
        var _this = this;
        this.logger("initialize");
        var owner = this;
        var active = this.active;
        this.networkingListener = new org.conservify.networking.NetworkingListener({
            onStarted: function () {
                owner.started.resolve();
            },
            onDiscoveryFailed: function () {
                owner.started.reject(new Error("discovery failed"));
            },
            onFoundService: function (service) {
                owner.logger("onFoundService", service.getName(), service.getType(), service.getAddress(), service.getPort());
                owner.discoveryEvents.onFoundService({
                    name: service.getName(),
                    type: service.getType(),
                    host: service.getAddress(),
                    port: service.getPort(),
                });
            },
            onLostService: function (service) {
                owner.logger("onLostService", service.getName(), service.getType());
                owner.discoveryEvents.onLostService({
                    name: service.getName(),
                    type: service.getType(),
                    host: service.getAddress(),
                    port: service.getPort(),
                });
            },
            onNetworkStatus: function (status) {
                if (owner.networkStatus) {
                    var getConnectedWifi = function () {
                        if (status.getConnectedWifi() == null || status.getConnectedWifi().getSsid() == null) {
                            return null;
                        }
                        return {
                            ssid: status.getConnectedWifi().getSsid().replace(/"/g, ""),
                        };
                    };
                    var getWifiNetworks = function () {
                        if (status.getWifiNetworks() == null) {
                            return null;
                        }
                        var found = [];
                        var networksArray = status.getWifiNetworks().getNetworks();
                        if (networksArray != null) {
                            for (var i = 0; i < networksArray.size(); ++i) {
                                var n = networksArray[i];
                                found.push({
                                    ssid: n.getSsid(),
                                });
                            }
                        }
                        return found;
                    };
                    var jsObject = {
                        connected: status.getConnected(),
                        connectedWifi: getConnectedWifi(),
                        wifiNetworks: getWifiNetworks(),
                    };
                    owner.networkStatus.resolve(jsObject);
                    owner.networkStatus = null;
                } else {
                    owner.logger("onNetworkStatus: no promise!");
                }
            },
        });
        this.uploadListener = new org.conservify.networking.WebTransferListener({
            onProgress: function (taskId, headers, bytes, total) {
                owner.logger("upload:onProgress", taskId, bytes, total);
                if (active[taskId]) {
                    var info = active[taskId].info;
                    var progress = info.progress;
                    if (progress) {
                        progress(total, bytes, info);
                    }
                } else {
                    this.logger("upload:onProgress orphaned", taskId, bytes, total);
                }
            },
            onComplete: function (taskId, headers, contentType, body, statusCode) {
                var jsHeaders = toJsHeaders(headers);
                owner.logger("upload:onComplete", taskId, jsHeaders, contentType, statusCode);
                var task = active[taskId];
                if (task) {
                    var info = task.info,
                        transfer_1 = task.transfer;
                    var getBody = function () {
                        if (body) {
                            if (contentType.indexOf("application/json") >= 0) {
                                return JSON.parse(body);
                            } else {
                                if (transfer_1.isBase64EncodeResponseBody()) {
                                    return Buffer.from(body, "base64");
                                }
                                return body;
                            }
                        }
                        return null;
                    };
                    delete active[taskId];
                    task.resolve({
                        info: info,
                        headers: jsHeaders,
                        statusCode: statusCode,
                        body: getBody(),
                    });
                } else {
                    owner.logger("upload:onComplete (orphaned)", taskId, jsHeaders, contentType, statusCode);
                }
            },
            onError: function (taskId, message) {
                owner.logger("upload:onError", taskId, message);
                var task = active[taskId];
                if (task) {
                    var info = task.info;
                    delete active[taskId];
                    task.reject(new conservify_common_1.ConnectionError(message, info));
                } else {
                    owner.logger("upload:onError (orphaned)", taskId, message);
                }
            },
        });
        this.downloadListener = new org.conservify.networking.WebTransferListener({
            onProgress: function (taskId, headers, bytes, total) {
                owner.logger("download:onProgress", taskId, bytes, total);
                if (active[taskId]) {
                    var info = active[taskId].info;
                    var progress = info.progress;
                    if (progress) {
                        progress(total, bytes, info);
                    }
                } else {
                    owner.logger("download:onProgress (orphaned)", taskId, bytes, total);
                }
            },
            onComplete: function (taskId, headers, contentType, body, statusCode) {
                var jsHeaders = toJsHeaders(headers);
                owner.logger("download:onComplete", taskId, jsHeaders, contentType, statusCode);
                var task = active[taskId];
                if (task) {
                    var info = task.info,
                        transfer_2 = task.transfer;
                    var getBody = function () {
                        if (body) {
                            if (contentType.indexOf("application/json") >= 0) {
                                return JSON.parse(body);
                            } else {
                                if (transfer_2.isBase64EncodeResponseBody()) {
                                    return Buffer.from(body, "base64");
                                }
                                return body;
                            }
                        }
                        return null;
                    };
                    delete active[taskId];
                    task.resolve({
                        info: info,
                        headers: jsHeaders,
                        statusCode: statusCode,
                        body: getBody(),
                    });
                } else {
                    owner.logger("download:onComplete (orphaned)", taskId, jsHeaders, contentType, statusCode);
                }
            },
            onError: function (taskId, message) {
                owner.logger("download:onError", taskId, message);
                var task = active[taskId];
                if (task) {
                    var info = task.info;
                    delete active[taskId];
                    task.reject(new conservify_common_1.ConnectionError(message, info));
                } else {
                    owner.logger("download:onError (orphaned)", taskId, message);
                }
            },
        });
        this.fsListener = new org.conservify.data.FileSystemListener({
            onFileInfo: function (path, token, info) {
                owner.logger("fs:onFileInfo", path, token, info);
                var task = active[token];
                if (task) {
                    task.resolve({
                        path: info.getFile(),
                        size: info.getSize(),
                    });
                }
            },
            onFileRecords: function (path, token, position, size, records) {
                owner.logger("fs:onFileRecords", path, token, position, size, records != null ? records.size() : "");
                var task = active[token];
                if (task) {
                    if (records) {
                        task.listener(position, size, records);
                    } else {
                        task.resolve();
                    }
                }
            },
            onFileError: function (path, token, message) {
                owner.logger("fs:onFileError", path, token, message);
                var task = active[token];
                if (task) {
                    task.reject(new conservify_common_1.FileSystemError(message, path));
                }
            },
        });
        this.fileSystem = new org.conservify.data.FileSystem(application_1.android.context, this.fsListener);
        this.networking = new org.conservify.networking.Networking(
            application_1.android.context,
            this.networkingListener,
            this.uploadListener,
            this.downloadListener
        );
        return new Promise(function (resolve, reject) {
            _this.started = {
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getServiceDiscovery().start(serviceType);
            owner.logger("starting...");
        });
    };
    Conservify.prototype.writeSampleData = function () {
        var sampleData = new org.conservify.data.SampleData();
        return Promise.resolve(sampleData.write());
    };
    Conservify.prototype.open = function (path) {
        return Promise.resolve(new OpenedFile(this, this.fileSystem.open(path)));
    };
    Conservify.prototype.text = function (info) {
        var _this = this;
        var transfer = new org.conservify.networking.WebTransfer();
        transfer.setMethod(info.method);
        transfer.setUrl(info.url);
        transfer.setBody(info.body);
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i],
                key = _b[0],
                value = _b[1];
            transfer.header(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.getId()] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getWeb().binary(transfer);
        });
    };
    Conservify.prototype.json = function (info) {
        var _this = this;
        var transfer = new org.conservify.networking.WebTransfer();
        transfer.setMethod(info.method);
        transfer.setUrl(info.url);
        transfer.setBody(info.body);
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i],
                key = _b[0],
                value = _b[1];
            transfer.header(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.getId()] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getWeb().json(transfer);
        });
    };
    Conservify.prototype.protobuf = function (info) {
        var _this = this;
        var transfer = new org.conservify.networking.WebTransfer();
        transfer.setMethod(info.method);
        transfer.setUrl(info.url);
        transfer.setBase64EncodeResponseBody(true);
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i],
                key = _b[0],
                value = _b[1];
            transfer.header(key, value);
        }
        if (info.body) {
            var requestBody = Buffer.from(info.body).toString("base64");
            transfer.setBody(requestBody);
            transfer.setBase64DecodeRequestBody(true);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.getId()] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getWeb().binary(transfer);
        });
    };
    Conservify.prototype.download = function (info) {
        var _this = this;
        var transfer = new org.conservify.networking.WebTransfer();
        transfer.setMethod(info.method);
        transfer.setUrl(info.url);
        transfer.setPath(info.path);
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i],
                key = _b[0],
                value = _b[1];
            transfer.header(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.getId()] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getWeb().download(transfer);
        });
    };
    Conservify.prototype.upload = function (info) {
        var _this = this;
        var transfer = new org.conservify.networking.WebTransfer();
        transfer.setMethod(info.method);
        transfer.setUrl(info.url);
        transfer.setPath(info.path);
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i],
                key = _b[0],
                value = _b[1];
            transfer.header(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.getId()] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getWeb().upload(transfer);
        });
    };
    Conservify.prototype.findConnectedNetwork = function () {
        var _this = this;
        if (!this.networking) {
            return Promise.reject(new Error("networking uninitialized"));
        }
        return new Promise(function (resolve, reject) {
            _this.networkStatus = {
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getWifi().findConnectedNetwork();
        });
    };
    Conservify.prototype.scanNetworks = function () {
        var _this = this;
        if (!this.networking) {
            return Promise.reject(new Error("networking uninitialized"));
        }
        return new Promise(function (resolve, reject) {
            _this.networkStatus = {
                resolve: resolve,
                reject: reject,
            };
            _this.networking.getWifi().scan();
        });
    };
    return Conservify;
})(conservify_common_1.Common);
exports.Conservify = Conservify;
//# sourceMappingURL=conservify.android.js.map
