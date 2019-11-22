"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var conservify_common_1 = require("./conservify.common");
var application_1 = require("tns-core-modules/application");
var debug = (function () {
    if (false) {
        return console.log;
    }
    return function () { };
})();
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
var Conservify = (function (_super) {
    __extends(Conservify, _super);
    function Conservify(discoveryEvents) {
        var _this = _super.call(this) || this;
        _this.active = {};
        _this.scan = null;
        _this.connected = null;
        _this.discoveryEvents = discoveryEvents;
        return _this;
    }
    Conservify.prototype.start = function (serviceType) {
        debug("initialize");
        var owner = this;
        var active = this.active;
        this.networkingListener = new org.conservify.networking.NetworkingListener({
            onFoundService: function (service) {
                debug("onFoundService", service);
                owner.discoveryEvents.onFoundService({
                    name: service.getName(),
                    type: service.getType(),
                    host: service.getAddress(),
                    port: service.getPort(),
                });
            },
            onLostService: function (service) {
                debug("onLostService", service);
                owner.discoveryEvents.onLostService({
                    name: service.getName(),
                    type: service.getType(),
                    host: service.getAddress(),
                    port: service.getPort(),
                });
            },
            onConnectionInfo: function (connected) {
                debug("onConnectionInfo", connected);
            },
            onConnectedNetwork: function (network) {
                debug("onConnectedNetwork", network.getSsid());
                if (owner.connected) {
                    owner.connected.resolve(network);
                    owner.connected = null;
                }
            },
            onNetworksFound: function (networks) {
                if (owner.scan) {
                    debug("onNetworksFound", networks, networks.getNetworks());
                    var found = [];
                    for (var i = 0; i < networks.getNetworks().size(); ++i) {
                        var n = networks.getNetworks()[i];
                        found.push({
                            ssid: n.getSsid()
                        });
                    }
                    owner.scan.resolve(found);
                    owner.scan = null;
                }
                else {
                    console.error("onNetworksFound no promise");
                }
            },
            onNetworkScanError: function () {
                if (owner.scan) {
                    debug("onNetworkScanError");
                    owner.scan.reject();
                    owner.scan = null;
                }
                else {
                    console.error("onNetworkScanError no promise");
                }
            },
        });
        this.uploadListener = new org.conservify.networking.WebTransferListener({
            onProgress: function (taskId, headers, bytes, total) {
                debug("upload:onProgress", taskId, bytes, total);
                var info = active[taskId].info;
                var progress = info.progress;
                if (progress) {
                    progress(total, bytes, info);
                }
            },
            onComplete: function (taskId, headers, contentType, body, statusCode) {
                debug("upload:onComplete", taskId, headers, contentType, body, statusCode);
                var task = active[taskId];
                var info = task.info, transfer = task.transfer;
                function getBody() {
                    if (body) {
                        if (contentType.indexOf("application/json") >= 0) {
                            return JSON.parse(body);
                        }
                        else {
                            if (transfer.isBase64EncodeResponseBody()) {
                                return Buffer.from(body, "base64");
                            }
                            return body;
                        }
                    }
                    return null;
                }
                delete active[taskId];
                task.resolve({
                    info: info,
                    headers: toJsHeaders(headers),
                    statusCode: statusCode,
                    body: getBody(),
                });
            },
            onError: function (taskId) {
                debug("upload:onError", taskId);
                var task = active[taskId];
                var info = task.info;
                delete active[taskId];
                task.reject({
                    info: info,
                });
            },
        });
        this.downloadListener = new org.conservify.networking.WebTransferListener({
            onProgress: function (taskId, headers, bytes, total) {
                debug("download:onProgress", taskId, bytes, total);
                var info = active[taskId].info;
                var progress = info.progress;
                if (progress) {
                    progress(total, bytes, info);
                }
            },
            onComplete: function (taskId, headers, contentType, body, statusCode) {
                debug("download:onComplete", taskId, headers, contentType, body, statusCode);
                var task = active[taskId];
                var info = task.info, transfer = task.transfer;
                function getBody() {
                    if (body) {
                        if (contentType.indexOf("application/json") >= 0) {
                            return JSON.parse(body);
                        }
                        else {
                            if (transfer.isBase64EncodeResponseBody()) {
                                return Buffer.from(body, "base64");
                            }
                            return body;
                        }
                    }
                    return null;
                }
                delete active[taskId];
                task.resolve({
                    info: info,
                    headers: toJsHeaders(headers),
                    statusCode: statusCode,
                    body: getBody(),
                });
            },
            onError: function (taskId) {
                debug("download:onError", taskId);
                var task = active[taskId];
                var info = task.info;
                delete active[taskId];
                task.reject({
                    info: info
                });
            },
        });
        this.dataListener = new org.conservify.data.DataListener({
            onFileInfo: function (path, info) {
                debug("fs:onFileInfo", path, info);
            },
            onFileRecords: function (path, records) {
                debug("fs:onFileRecords", path, records);
            },
            onFileAnalysis: function (path, analysis) {
                debug("fs:onFileAnalysis", path, analysis);
            },
        });
        this.fileSystem = new org.conservify.data.FileSystem(application_1.android.context, this.dataListener);
        this.networking = new org.conservify.networking.Networking(application_1.android.context, this.networkingListener, this.uploadListener, this.downloadListener);
        this.networking.getServiceDiscovery().start(serviceType);
        debug("ready");
        return Promise.resolve({});
    };
    Conservify.prototype.json = function (info) {
        var _this = this;
        var transfer = new org.conservify.networking.WebTransfer();
        transfer.setMethod(info.method);
        transfer.setUrl(info.url);
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
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
            var _b = _a[_i], key = _b[0], value = _b[1];
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
            var _b = _a[_i], key = _b[0], value = _b[1];
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
            var _b = _a[_i], key = _b[0], value = _b[1];
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
        return new Promise(function (resolve, reject) {
            _this.connected = {
                resolve: resolve,
                reject: reject
            };
            _this.networking.getWifi().findConnectedNetwork();
        });
    };
    Conservify.prototype.scanNetworks = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.scan = {
                resolve: resolve,
                reject: reject
            };
            _this.networking.getWifi().scan();
        });
    };
    return Conservify;
}(conservify_common_1.Common));
exports.Conservify = Conservify;
//# sourceMappingURL=conservify.android.js.map