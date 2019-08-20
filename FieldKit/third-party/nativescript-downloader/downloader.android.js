"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var downloader_common_1 = require("./downloader.common");
var fs = require("tns-core-modules/file-system");
var utils = require("tns-core-modules/utils/utils");
var Downloader = (function (_super) {
    __extends(Downloader, _super);
    function Downloader() {
        var _this = _super.call(this) || this;
        _this.downloads = new Map();
        _this.downloadsData = new Map();
        _this.downloadRequests = new Map();
        _this.taskIds = new Map();
        return _this;
    }
    Downloader.init = function () {
        co.fitcom.fancydownloader.Manager.init(utils.ad.getApplicationContext());
    };
    Downloader.setTimeout = function (timeout) {
        co.fitcom.fancydownloader.Manager.setTimeout(timeout);
        // var manager = co.fitcom.fancydownloader.Manager.getInstance();
        // manager.setTimeout(timeout);
    };
    Downloader.prototype.createDownload = function (options) {
        if (options && !options.url)
            throw new Error('Url missing');
        var taskId = downloader_common_1.generateId();
        if (!this.manager) {
            this.manager = co.fitcom.fancydownloader.Manager.getInstance();
        }
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
        var request = new co.fitcom.fancydownloader.Request(url);
        var path = '';
        if (options.path) {
            request.setFilePath(options.path);
        }
        if (options.fileName) {
            request.setFileName(options.fileName);
        }
        if (options.headers) {
            var keysArray = Object.keys(options.headers);
            var headers = new java.util.HashMap();
            for (var _a = 0, keysArray_2 = keysArray; _a < keysArray_2.length; _a++) {
                var key = keysArray_2[_a];
                headers.put(key, options.headers[key]);
            }
            request.setHeaders(headers);
        }
        var task = this.manager.create(request);
        path = fs.path.join(request.getFilePath(), request.getFileName());
        this.taskIds.set(task, taskId);
        this.downloads.set(taskId, task);
        this.downloadRequests.set(taskId, request);
        this.downloadsData.set(taskId, {
            status: downloader_common_1.StatusCode.PENDING
        });
        return taskId;
    };
    Downloader.prototype.getStatus = function (id) {
        if (id && this.downloads.has(id)) {
            var data = this.downloadsData.get(id);
            return data.status;
        }
        return downloader_common_1.StatusCode.PENDING;
    };
    Downloader.prototype.start = function (id, progress) {
        var _this = this;
        var ref = new WeakRef(this);
        return new Promise(function (resolve, reject) {
            if (id) {
                var data = _this.downloadsData.get(id);
                _this.downloadsData.set(id, Object.assign({}, data, {
                    reject: reject,
                    resolve: resolve,
                    callback: progress
                }));
                if (_this.downloads.has(id)) {
                    var request = _this.downloadRequests.get(id);
                    var downloadId = _this.downloads.get(id);
                    if (request) {
                        var listener = co.fitcom.fancydownloader.DownloadListenerUI.extend({
                            ownerRef: ref,
                            onUIProgress: function (task, currentBytes, totalBytes, speed) {
                                var current = Math.floor(Math.round(currentBytes / totalBytes * 100));
                                var owner = this.ownerRef.get();
                                var _id = owner.taskIds.get(task);
                                if (owner.downloads.has(_id)) {
                                    var data_1 = owner.downloadsData.get(_id);
                                    var callback = data_1.callback;
                                    if (data_1.status !== downloader_common_1.StatusCode.DOWNLOADING) {
                                        owner.downloadsData.set(_id, Object.assign({}, data_1, {
                                            status: downloader_common_1.StatusCode.DOWNLOADING
                                        }));
                                    }
                                    if (callback && typeof callback === 'function') {
                                        callback({
                                            value: current,
                                            speed: speed,
                                            currentSize: currentBytes,
                                            totalSize: totalBytes
                                        });
                                    }
                                }
                            },
                            onUIComplete: function (task) {
                                var owner = this.ownerRef.get();
                                var _id = owner.taskIds.get(task);
                                if (owner.downloads.has(_id)) {
                                    var data_2 = owner.downloadsData.get(_id);
                                    var resolve_1 = data_2.resolve;
                                    var _request = owner.downloadRequests.get(_id);
                                    if (resolve_1) {
                                        resolve_1({
                                            status: downloader_common_1.StatusCode.COMPLETED,
                                            path: fs.path.join(_request.getFilePath(), _request.getFileName())
                                        });
                                    }
                                }
                            },
                            onUIError: function (task, error) {
                                var owner = this.ownerRef.get();
                                var _id = owner.taskIds.get(task);
                                if (owner.downloads.has(_id)) {
                                    var data_3 = owner.downloadsData.get(_id);
                                    var reject_1 = data_3.reject;
                                    var message = error.getLocalizedMessage();
                                    if (reject_1) {
                                        if (message.toLowerCase().indexOf('socket closed') === -1) {
                                            reject_1({
                                                status: downloader_common_1.StatusCode.ERROR,
                                                message: error.getLocalizedMessage()
                                            });
                                        }
                                    }
                                }
                            }
                        });
                        var newListener = new listener();
                        newListener.ownerRef = ref;
                        request.setListener(newListener);
                    }
                    _this.manager.start(downloadId);
                }
            }
        });
    };
    Downloader.prototype.resume = function (id) {
        if (id) {
            if (this.downloads.has(id)) {
                var downloadId = this.downloads.get(id);
                this.manager.resume(downloadId);
            }
        }
    };
    Downloader.prototype.cancel = function (id) {
        if (id) {
            if (this.downloads.has(id)) {
                var downloadId = this.downloads.get(id);
                this.manager.cancel(downloadId);
                this.downloads.delete(id);
                this.downloadsData.delete(id);
            }
        }
    };
    Downloader.prototype.pause = function (id) {
        var _this = this;
        if (id) {
            if (this.downloads.has(id)) {
                var downloadId = this.downloads.get(id);
                var data_4 = this.downloadsData.get(id);
                this.manager.pause(downloadId);
                setTimeout(function () {
                    _this.downloadsData.set(id, Object.assign({}, data_4, {
                        status: downloader_common_1.StatusCode.PAUSED
                    }));
                }, 100);
            }
        }
    };
    Downloader.prototype.getPath = function (id) {
        if (id && this.downloadsData.has(id)) {
            var download = this.downloadsData.get(id);
            return download.path;
        }
        return null;
    };
    return Downloader;
}(downloader_common_1.DownloaderBase));
exports.Downloader = Downloader;
//# sourceMappingURL=downloader.android.js.map