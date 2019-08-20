"use strict";
class NativePropertyReader {
    constructor() {
        this._invocationCache = new Map();
    }
    getInvocationObject(object, selector) {
        let invocation = this._invocationCache.get(selector);
        if (!invocation) {
            const sig = object.methodSignatureForSelector(selector);
            invocation = NSInvocation.invocationWithMethodSignature(sig);
            invocation.selector = selector;
            this._invocationCache[selector] = invocation;
        }
        return invocation;
    }
    readProp(object, prop, type) {
        const invocation = this.getInvocationObject(object, prop);
        invocation.invokeWithTarget(object);
        const ret = new interop.Reference(type, new interop.Pointer());
        invocation.getReturnValue(ret);
        return ret.value;
    }
}

Object.defineProperty(exports, "__esModule", { value: true });
var downloader_common_1 = require("./downloader.common");
var fs = require("tns-core-modules/file-system");
var main_queue = dispatch_get_current_queue();
var tasksReader = new NativePropertyReader();
var Downloader = (function (_super) {
    __extends(Downloader, _super);
    function Downloader() {
        var _this = _super.call(this) || this;
        _this.downloads = new Map();
        _this.downloadsData = new Map();
        return _this;
    }
    Downloader.init = function () { };
    Downloader.setTimeout = function (timeout) {
        Downloader.timeout = timeout;
    };
    Downloader.prototype.createDownload = function (options) {
        if (options && !options.url)
            throw new Error('Url missing');
        var id = downloader_common_1.generateId();
        var configuration = NSURLSessionConfiguration.defaultSessionConfiguration;
        configuration.timeoutIntervalForRequest = Downloader.timeout;
        configuration.timeoutIntervalForResource = Downloader.timeout;
        var download = AFURLSessionManager.alloc().initWithSessionConfiguration(configuration);
        var url;
        var query;
        if (options.query) {
            if (typeof options.query === 'object') {
                var keysArray = Object.keys(options.query);
                query = '';
                for (var _i = 0, keysArray_1 = keysArray; _i < keysArray_1.length; _i++) {
                    var key = keysArray_1[_i];
                    query += key + '=' + options.query[key] + '&';
                }
            }
            else if (typeof options.query === 'string') {
                query = options.query;
            }
            url = encodeURI(options.url + query);
        }
        else {
            url = options.url;
        }
        var request = NSURLRequest.requestWithURL(NSURL.URLWithString(url));
        var path = '';
        if (options.path && options.fileName) {
            path = fs.path.join(options.path, options.fileName);
        }
        else if (!options.path && options.fileName) {
            path = fs.path.join(fs.knownFolders.temp().path, options.fileName);
        }
        else if (options.path && !options.fileName) {
            path = fs.path.join(options.path, "" + downloader_common_1.generateId());
        }
        else {
            path = fs.path.join(fs.knownFolders.temp().path, "" + downloader_common_1.generateId());
        }
        // var ref = new WeakRef(this);
        var strongRef = this;
        var lastRefreshTime = 0;
        var lastBytesWritten = 0;
        var task = download.downloadTaskWithRequestProgressDestinationCompletionHandler(request, function (progress) {
            dispatch_async(main_queue, function () {
                // var owner = ref.get();
                var owner = strongRef;
                var stateValue = tasksReader.readProp(task, "state", interop.types.int64);
                if (task && stateValue === 0) {
                    var current = Math.floor(Math.round(progress.fractionCompleted * 100));
                    if (owner && owner.downloadsData && owner.downloadsData.has(id)) {
                        var data = owner.downloadsData.get(id);
                        if (data) {
                            if (data.status && data.status !== downloader_common_1.StatusCode.DOWNLOADING) {
                                owner.downloadsData.set(id, Object.assign({}, data, {
                                    status: downloader_common_1.StatusCode.DOWNLOADING
                                }));
                            }
                        }
                        var callback = data.callback;
                        var speed = void 0;
                        var countReceived = tasksReader.readProp(task, "countOfBytesReceived", interop.types.int64);
                        var currentBytes = countReceived;
                        var totalBytes = progress.totalUnitCount;
                        var currentTime = Date.now();
                        var minTime = 100;
                        if (currentTime - lastRefreshTime >= minTime ||
                            currentBytes === totalBytes) {
                            var intervalTime = currentTime - lastRefreshTime;
                            if (intervalTime === 0) {
                                intervalTime += 1;
                            }
                            var updateBytes = currentBytes - lastBytesWritten;
                            speed = Math.floor(Math.round(updateBytes / intervalTime));
                            if (callback && typeof callback === 'function') {
                                callback({
                                    value: current,
                                    speed: speed,
                                    currentSize: currentBytes,
                                    totalSize: progress.totalUnitCount
                                });
                            }
                            lastRefreshTime = Date.now();
                            lastBytesWritten = currentBytes;
                        }
                    }
                }
                else if (stateValue === 1) {
                    var data = owner.downloadsData.get(id);
                    if (data) {
                        owner.downloadsData.set(id, Object.assign({}, data, {
                            status: downloader_common_1.StatusCode.PAUSED
                        }));
                    }
                }
            });
        }, function (targetPath, response) {
            // var owner = ref.get();
            return NSURL.fileURLWithPath(path);
        }, function (response, filePath, error) {
            // var owner = ref.get();
            var owner = strongRef;
            if (error) {
                if (owner && owner.downloadsData && owner.downloadsData.has(id)) {
                    var data = owner.downloadsData.get(id);
                    var reject = data.reject;
                    reject({
                        status: downloader_common_1.StatusCode.ERROR,
                        message: error.localizedDescription
                    });
                }
            }
            else {
                var stateValue = tasksReader.readProp(task, "state", interop.types.int64);
                var errorValue = tasksReader.readProp(task, "error", interop.types.int64);
                if (task &&
                    stateValue === 3 &&
                    !errorValue) {
                    if (owner && owner.downloadsData && owner.downloadsData.has(id)) {
                        var data = owner.downloadsData.get(id);
                        var resolve = data.resolve;
                        resolve({
                            status: downloader_common_1.StatusCode.COMPLETED,
                            message: null,
                            path: data.path
                        });
                        strongRef.downloads = new Map();
                        strongRef.downloadsData = new Map();
                    }
                }
            }
        });
        this.downloads.set(id, task);
        this.downloadsData.set(id, {
            status: downloader_common_1.StatusCode.PENDING,
            path: path
        });
        return id;
    };
    Downloader.prototype.start = function (id, progress) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (id && _this.downloads.has(id)) {
                var data = _this.downloadsData.get(id);
                _this.downloadsData.set(id, Object.assign({}, data, {
                    reject: reject,
                    resolve: resolve,
                    callback: progress
                }));
                var task = _this.downloads.get(id);
                if (task) {
                    task.resume();
                }
            }
            else {
                reject({ message: 'Download ID not found.' });
            }
        });
    };
    Downloader.prototype.getStatus = function (id) {
        if (id && this.downloads.has(id)) {
            var download = this.downloadsData.get(id);
            return download.status;
        }
        return downloader_common_1.StatusCode.PENDING;
    };
    Downloader.prototype.pause = function (id) {
        if (id && this.downloads.has(id)) {
            var task = this.downloads.get(id);
            if (task) {
                task.suspend();
                var data = this.downloadsData.get(id);
                if (data) {
                    this.downloadsData.set(id, Object.assign({}, data, {
                        status: downloader_common_1.StatusCode.PAUSED
                    }));
                }
            }
        }
    };
    Downloader.prototype.resume = function (id) {
        if (id && this.downloads.has(id)) {
            var task = this.downloads.get(id);
            if (task) {
                task.resume();
            }
        }
    };
    Downloader.prototype.cancel = function (id) {
        if (id && this.downloads.has(id)) {
            var task = this.downloads.get(id);
            if (task) {
                task.cancel();
            }
        }
    };
    Downloader.prototype.getPath = function (id) {
        if (id && this.downloadsData.has(id)) {
            var data = this.downloadsData.get(id);
            if (data) {
                return data.path;
            }
            return null;
        }
        return null;
    };
    Downloader.timeout = 60;
    return Downloader;
}(downloader_common_1.DownloaderBase));
exports.Downloader = Downloader;
//# sourceMappingURL=downloader.ios.js.map