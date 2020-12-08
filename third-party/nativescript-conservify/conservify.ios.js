"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var conservify_common_1 = require("./conservify.common");
var MyNetworkingListener = (function (_super) {
    __extends(MyNetworkingListener, _super);
    function MyNetworkingListener() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MyNetworkingListener.alloc = function () {
        return _super.new.call(this);
    };
    MyNetworkingListener.prototype.initWithPromises = function (promises, logger) {
        this.promises = promises;
        this.logger = logger;
        return this;
    };
    MyNetworkingListener.prototype.onStarted = function () {
        this.logger("onStarted");
        this.promises.getStartedPromise().resolve(null);
    };
    MyNetworkingListener.prototype.onStopped = function () {
        this.logger("onStopped");
        this.promises.getStoppedPromise().resolve(null);
    };
    MyNetworkingListener.prototype.onDiscoveryFailed = function () {
        this.promises.getStartedPromise().reject(new Error("discovery failed"));
    };
    MyNetworkingListener.prototype.onFoundServiceWithService = function (service) {
        this.logger("onFoundServiceWithService", service.type, service.name, service.host, service.port);
        this.promises.getDiscoveryEvents().onFoundService({
            name: service.name,
            type: service.type,
            host: service.host,
            port: service.port,
        });
    };
    MyNetworkingListener.prototype.onLostServiceWithService = function (service) {
        this.logger("onLostServiceWithService", service.type, service.name);
        this.promises.getDiscoveryEvents().onLostService({
            name: service.name,
            type: service.type,
            host: service.host,
            port: service.port,
        });
    };
    MyNetworkingListener.prototype.onUdpMessageWithMessage = function (message) {
        this.logger("onUdpMessageWithMessage", message);
        this.promises.getDiscoveryEvents().onUdpMessage({
            address: message.address,
            data: message.data,
        });
    };
    MyNetworkingListener.prototype.onNetworkStatusWithStatus = function (status) {
        this.promises.getNetworkStatusPromise().resolve(status);
    };
    MyNetworkingListener.ObjCProtocols = [NetworkingListener];
    return MyNetworkingListener;
}(NSObject));
function toJsHeaders(headers) {
    var jsHeaders = {};
    for (var i = 0; i < headers.allKeys.count; ++i) {
        var key = headers.allKeys[i];
        jsHeaders[key.toLowerCase()] = headers.valueForKey(key);
    }
    return jsHeaders;
}
var UploadListener = (function (_super) {
    __extends(UploadListener, _super);
    function UploadListener() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    UploadListener.alloc = function () {
        return _super.new.call(this);
    };
    UploadListener.prototype.initWithTasks = function (tasks, logger) {
        this.tasks = tasks;
        this.logger = logger;
        return this;
    };
    UploadListener.prototype.onProgressWithTaskIdHeadersBytesTotal = function (taskId, headers, bytes, total) {
        this.logger("upload:onProgress", taskId, bytes, total);
        var task = this.tasks.getTask(taskId);
        if (task) {
            var info = task.info;
            var progress = info.progress;
            if (progress) {
                progress(total, bytes, info);
            }
        }
        else {
            this.logger("upload:onProgress (orphaned)", taskId, bytes, total);
        }
    };
    UploadListener.prototype.onCompleteWithTaskIdHeadersContentTypeBodyStatusCode = function (taskId, headers, contentType, body, statusCode) {
        var jsHeaders = toJsHeaders(headers);
        this.logger("upload:onComplete", taskId, jsHeaders, contentType, statusCode);
        var task = this.tasks.getTask(taskId);
        if (task) {
            var info = task.info, transfer_1 = task.transfer;
            this.tasks.removeTask(taskId);
            var getBody = function () {
                if (body) {
                    if (contentType.indexOf("application/json") >= 0) {
                        return JSON.parse(body);
                    }
                    else {
                        if (transfer_1.base64EncodeResponseBody) {
                            return Buffer.from(body, "base64");
                        }
                        return body;
                    }
                }
                return null;
            };
            task.resolve({
                info: info,
                headers: jsHeaders,
                statusCode: statusCode,
                body: getBody(),
            });
        }
        else {
            this.logger("upload:onComplete (orphaned)", taskId, jsHeaders, contentType, statusCode);
        }
    };
    UploadListener.prototype.onErrorWithTaskIdMessage = function (taskId, message) {
        this.logger("upload:onError", taskId);
        var task = this.tasks.getTask(taskId);
        if (task) {
            var info = task.info;
            this.tasks.removeTask(taskId);
            task.reject(new conservify_common_1.ConnectionError(message, info));
        }
        else {
            this.logger("upload:onError (orphaned)", taskId);
        }
    };
    UploadListener.ObjCProtocols = [WebTransferListener];
    return UploadListener;
}(NSObject));
var DownloadListener = (function (_super) {
    __extends(DownloadListener, _super);
    function DownloadListener() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DownloadListener.alloc = function () {
        return _super.new.call(this);
    };
    DownloadListener.prototype.initWithTasks = function (tasks, logger) {
        this.tasks = tasks;
        this.logger = logger;
        return this;
    };
    DownloadListener.prototype.onProgressWithTaskIdHeadersBytesTotal = function (taskId, headers, bytes, total) {
        this.logger("download:onProgress", taskId, bytes, total);
        var task = this.tasks.getTask(taskId);
        if (task) {
            var info = task.info;
            var progress = info.progress;
            if (progress) {
                progress(total, bytes, info);
            }
        }
        else {
            this.logger("download:onProgress (orphaned)", taskId, bytes, total);
        }
    };
    DownloadListener.prototype.onCompleteWithTaskIdHeadersContentTypeBodyStatusCode = function (taskId, headers, contentType, body, statusCode) {
        var jsHeaders = toJsHeaders(headers);
        this.logger("download:onComplete", taskId, jsHeaders, contentType, statusCode);
        var task = this.tasks.getTask(taskId);
        if (task) {
            var info = task.info, transfer_2 = task.transfer;
            this.tasks.removeTask(taskId);
            var getBody = function () {
                if (body) {
                    if (contentType.indexOf("application/json") >= 0) {
                        return JSON.parse(body);
                    }
                    else {
                        if (transfer_2.base64EncodeResponseBody) {
                            return Buffer.from(body, "base64");
                        }
                        return body;
                    }
                }
                return null;
            };
            task.resolve({
                info: info,
                headers: jsHeaders,
                statusCode: statusCode,
                body: getBody(),
            });
        }
        else {
            this.logger("download:onComplete (orphaned)", taskId, jsHeaders, contentType, statusCode);
        }
    };
    DownloadListener.prototype.onErrorWithTaskIdMessage = function (taskId, message) {
        this.logger("download:onError", taskId, message);
        var task = this.tasks.getTask(taskId);
        if (task) {
            var info = task.info;
            this.tasks.removeTask(taskId);
            task.reject(new conservify_common_1.ConnectionError(message, info));
        }
        else {
            this.logger("download:onError (orphaned)", taskId, message);
        }
    };
    DownloadListener.ObjCProtocols = [WebTransferListener];
    return DownloadListener;
}(NSObject));
var MyFileSystemListener = (function (_super) {
    __extends(MyFileSystemListener, _super);
    function MyFileSystemListener() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MyFileSystemListener.alloc = function () {
        return _super.new.call(this);
    };
    MyFileSystemListener.prototype.initWithTasks = function (tasks, logger) {
        this.tasks = tasks;
        this.logger = logger;
        return this;
    };
    MyFileSystemListener.prototype.onFileInfoWithPathTokenInfo = function (path, token, info) {
        console.log("fs:onFileInfo", path, token, info);
        var task = this.tasks.getTask(token);
        if (task) {
            var resolve = task.resolve;
            resolve(info);
        }
    };
    MyFileSystemListener.prototype.onFileRecordsWithPathTokenPositionSizeRecords = function (path, token, position, size, records) {
        console.log("fs:onFileRecords", path, token, position, size, records != null ? records.count : "");
        var task = this.tasks.getTask(token);
        if (task) {
            var resolve = task.resolve, listener = task.listener;
            if (records) {
                listener(position, size, records);
            }
            else {
                resolve();
            }
        }
    };
    MyFileSystemListener.prototype.onFileErrorWithPathTokenError = function (path, token, error) {
        console.log("fs:onFileError", path, token, error);
        var task = this.tasks.getTask(token);
        if (task) {
            var reject = task.reject;
            reject(error);
        }
    };
    MyFileSystemListener.ObjCProtocols = [FileSystemListener];
    return MyFileSystemListener;
}(NSObject));
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
            _this.file.readInfoWithToken(token);
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
            var options = new ReadOptions();
            options.batchSize = 10;
            _this.file.readDelimitedWithTokenOptions(token, options);
            _this.cfy.active[token] = {
                listener: listener,
                resolve: resolve,
                reject: reject,
            };
        });
    };
    return OpenedFile;
}());
var globalAny = global;
var NetworkingProto = globalAny.Networking;
var ServiceDiscoveryProto = globalAny.ServiceDiscovery;
var WebProto = globalAny.Web;
var NetworkingListenerProto = globalAny.NetworkingListener;
var WebTransferListenerProto = globalAny.WebTransferListener;
var ServiceInfoProto = globalAny.ServiceInfo;
var WebTransferProto = globalAny.WebTransfer;
var WifiNetworkProto = globalAny.WifiNetwork;
var WifiManagerProto = globalAny.WifiManager;
var FileSystemListenerProto = globalAny.FileSystemListener;
var FileSystemProto = globalAny.FileSystem;
var PbFileProto = globalAny.PbFile;
var SampleDataProto = globalAny.SampleData;
var Conservify = (function () {
    function Conservify(discoveryEvents, logger) {
        this.logger = logger || console.log;
        this.active = {};
        this.scan = null;
        this.started = null;
        this.stopped = null;
        this.discoveryEvents = discoveryEvents;
        this.networkingListener = MyNetworkingListener.alloc().initWithPromises(this, this.logger);
        this.uploadListener = UploadListener.alloc().initWithTasks(this, this.logger);
        this.downloadListener = DownloadListener.alloc().initWithTasks(this, this.logger);
        this.networking = Networking.alloc().initWithNetworkingListenerUploadListenerDownloadListener(this.networkingListener, this.uploadListener, this.downloadListener);
        this.fsListener = MyFileSystemListener.alloc().initWithTasks(this, this.logger);
        this.fileSystem = FileSystem.alloc().initWithListener(this.fsListener);
    }
    Conservify.prototype.getTask = function (id) {
        return this.active[id];
    };
    Conservify.prototype.removeTask = function (id) {
        delete this.active[id];
    };
    Conservify.prototype.start = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.started = {
                resolve: resolve,
                reject: reject,
            };
            var iosOptions = DiscoveryStartOptions.alloc().init();
            iosOptions.serviceTypeSearch = options.serviceTypeSearch;
            iosOptions.serviceNameSelf = options.serviceNameSelf;
            iosOptions.serviceTypeSelf = options.serviceTypeSelf;
            _this.logger("starting:", JSON.stringify(iosOptions), JSON.stringify(options));
            _this.networking.serviceDiscovery.startWithOptions(iosOptions);
        });
    };
    Conservify.prototype.stop = function (options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.stopped = {
                resolve: resolve,
                reject: reject,
            };
            var iosOptions = DiscoveryStopOptions.alloc().init();
            iosOptions.suspending = options.suspending;
            _this.logger("stopping:", JSON.stringify(iosOptions), JSON.stringify(options));
            _this.networking.serviceDiscovery.stopWithOptions(iosOptions);
        });
    };
    Conservify.prototype.writeSampleData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sampleData;
            return __generator(this, function (_a) {
                sampleData = SampleData.alloc().init();
                sampleData.write();
                return [2, Promise.resolve()];
            });
        });
    };
    Conservify.prototype.open = function (path) {
        if (!this.fileSystem)
            throw new Error("use before initialize");
        return Promise.resolve(new OpenedFile(this, this.fileSystem.openWithPath(path)));
    };
    Conservify.prototype.copyFile = function (source, destiny) {
        if (!this.fileSystem)
            throw new Error("use before initialize");
        return Promise.resolve(this.fileSystem.copyFileWithSourceDestiny(source, destiny));
    };
    Conservify.prototype.json = function (info) {
        var _this = this;
        if (!this.networking)
            throw new Error("use before initialize");
        var transfer = WebTransfer.alloc().init();
        transfer.method = info.method;
        transfer.url = info.url;
        transfer.body = info.body;
        transfer.favorLocal = info.favorLocal;
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            transfer.headerWithKeyValue(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.id] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.web.simpleWithInfo(transfer);
        });
    };
    Conservify.prototype.text = function (info) {
        var _this = this;
        if (!this.networking)
            throw new Error("use before initialize");
        var transfer = WebTransfer.alloc().init();
        transfer.method = info.method;
        transfer.url = info.url;
        transfer.body = info.body;
        transfer.favorLocal = info.favorLocal;
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            transfer.headerWithKeyValue(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.id] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.web.simpleWithInfo(transfer);
        });
    };
    Conservify.prototype.protobuf = function (info) {
        var _this = this;
        if (!this.networking)
            throw new Error("use before initialize");
        var transfer = WebTransfer.alloc().init();
        transfer.method = info.method;
        transfer.url = info.url;
        transfer.base64EncodeResponseBody = true;
        transfer.favorLocal = info.favorLocal;
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            transfer.headerWithKeyValue(key, value);
        }
        if (info.body) {
            transfer.body = conservify_common_1.encodeBody(info.body);
            transfer.base64DecodeRequestBody = true;
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.id] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.web.simpleWithInfo(transfer);
        });
    };
    Conservify.prototype.download = function (info) {
        var _this = this;
        if (!this.networking)
            throw new Error("use before initialize");
        var transfer = WebTransfer.alloc().init();
        transfer.method = info.method;
        transfer.url = info.url;
        transfer.path = info.path;
        transfer.favorLocal = info.favorLocal;
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            transfer.headerWithKeyValue(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.id] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.web.downloadWithInfo(transfer);
        });
    };
    Conservify.prototype.upload = function (info) {
        var _this = this;
        if (!this.networking)
            throw new Error("use before initialize");
        var transfer = WebTransfer.alloc().init();
        transfer.method = info.method;
        transfer.url = info.url;
        transfer.path = info.path;
        transfer.uploadCopy = info.uploadCopy;
        transfer.favorLocal = info.favorLocal;
        for (var _i = 0, _a = Object.entries(info.headers || {}); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            transfer.headerWithKeyValue(key, value);
        }
        return new Promise(function (resolve, reject) {
            _this.active[transfer.id] = {
                info: info,
                transfer: transfer,
                resolve: resolve,
                reject: reject,
            };
            _this.networking.web.uploadWithInfo(transfer);
        });
    };
    Conservify.prototype.getDiscoveryEvents = function () {
        return this.discoveryEvents;
    };
    Conservify.prototype.getStartedPromise = function () {
        return this.started;
    };
    Conservify.prototype.getStoppedPromise = function () {
        return this.stopped;
    };
    Conservify.prototype.getNetworkStatusPromise = function () {
        return this.networkStatus;
    };
    Conservify.prototype.findConnectedNetwork = function () {
        var _this = this;
        if (!this.networking)
            throw new Error("use before initialize");
        return new Promise(function (resolve, reject) {
            _this.networkStatus = {
                resolve: resolve,
                reject: reject,
            };
            _this.networking.wifi.findConnectedNetwork();
        });
    };
    Conservify.prototype.scanNetworks = function () {
        var _this = this;
        if (!this.networking)
            throw new Error("use before initialize");
        return new Promise(function (resolve, reject) {
            _this.networkStatus = {
                resolve: resolve,
                reject: reject,
            };
            _this.networking.wifi.scan();
        });
    };
    return Conservify;
}());
exports.Conservify = Conservify;
//# sourceMappingURL=conservify.ios.js.map