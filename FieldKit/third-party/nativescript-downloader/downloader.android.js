import { DownloaderBase, StatusCode, generateId } from './downloader.common';
import * as fs from 'tns-core-modules/file-system';
import * as utils from 'tns-core-modules/utils/utils';
export class Downloader extends DownloaderBase {
    constructor() {
        super();
        this.downloads = new Map();
        this.downloadsData = new Map();
        this.downloadRequests = new Map();
        this.taskIds = new Map();

// tried binding these events here, but they still only work the first time
        var listener = co.fitcom.fancydownloader.DownloadListenerUI.extend({
            onUIProgress: this.onUIProgress.bind(this),
            onUIComplete: this.onUIComplete.bind(this),
            onUIError: this.onUIError.bind(this)
        });
        this.listener = new listener();
    }
    static init() {
        co.fitcom.fancydownloader.Manager.init(utils.ad.getApplicationContext());
    }
    static setTimeout(timeout) {
        co.fitcom.fancydownloader.Manager.setTimeout(timeout);
        // var manager = co.fitcom.fancydownloader.Manager.getInstance();
        // manager.setTimeout(timeout);
    }
    createDownload(options) {
        if (options && !options.url)
            throw new Error('Url missing');
        const taskId = generateId();
        if (!this.manager) {
            this.manager = co.fitcom.fancydownloader.Manager.getInstance();
        }
        let url;
        let query;
        if (options.query) {
            if (typeof options.query === 'object') {
                const keysArray = Object.keys(options.query);
                query = '';
                for (let key of keysArray) {
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
        const request = new co.fitcom.fancydownloader.Request(url);
        let path = '';
        if (options.path) {
            request.setFilePath(options.path);
        }
        if (options.fileName) {
            request.setFileName(options.fileName);
        }
        if (options.headers) {
            const keysArray = Object.keys(options.headers);
            const headers = new java.util.HashMap();
            for (let key of keysArray) {
                headers.put(key, options.headers[key]);
            }
            request.setHeaders(headers);
        }
        const task = this.manager.create(request);
        path = fs.path.join(request.getFilePath(), request.getFileName());
        this.taskIds.set(task, taskId);

// remove this
this.taskIds.forEach(function(value, key) {
  console.log("always correct context in createDownload:")
  console.log(key + ' = ' + value);
});
// end remove this

        this.downloads.set(taskId, task);
        this.downloadRequests.set(taskId, request);
        this.downloadsData.set(taskId, {
            status: StatusCode.PENDING
        });
        return taskId;
    }
    getStatus(id) {
        if (id && this.downloads.has(id)) {
            const data = this.downloadsData.get(id);
            return data.status;
        }
        return StatusCode.PENDING;
    }


    onUIProgress(task, currentBytes, totalBytes, speed) {
        const current = Math.floor(Math.round(currentBytes / totalBytes * 100));
        const _id = this.taskIds.get(task);

// remove this
if(currentBytes < 100000) {
    this.taskIds.forEach(function(value, key) {
      console.log("wrong context in onUIProgress AFTER FIRST RUN:");
      console.log(key + ' = ' + value);
    });
}
// end remove this

        if (this.downloads.has(_id)) {
            const data = this.downloadsData.get(_id);
            const callback = data.callback;
            if (data.status !== StatusCode.DOWNLOADING) {
                this.downloadsData.set(_id, Object.assign({}, data, {
                    status: StatusCode.DOWNLOADING
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
    }

    onUIComplete(task) {
        const _id = this.taskIds.get(task);
        if (this.downloads.has(_id)) {
            const data = this.downloadsData.get(_id);
            const resolve = data.resolve;
            const _request = this.downloadRequests.get(_id);
            if (resolve) {
                resolve({
                    status: StatusCode.COMPLETED,
                    path: fs.path.join(_request.getFilePath(), _request.getFileName())
                });
            }
        }
    }

    onUIError(task, error) {
        const _id = this.taskIds.get(task);
        if (this.downloads.has(_id)) {
            const data = this.downloadsData.get(_id);
            const reject = data.reject;
            const message = error.getLocalizedMessage();
            if (reject) {
                if (message.toLowerCase().indexOf('socket closed') === -1) {
                    reject({
                        status: StatusCode.ERROR,
                        message: error.getLocalizedMessage()
                    });
                }
            }
        }
    }

    start(id, progress) {
        // const ref = new WeakRef(this);
        return new Promise((resolve, reject) => {
            if (id) {
                const data = this.downloadsData.get(id);
                this.downloadsData.set(id, Object.assign({}, data, {
                    reject: reject,
                    resolve: resolve,
                    callback: progress
                }));
                if (this.downloads.has(id)) {
                    const request = this.downloadRequests.get(id);
                    const downloadId = this.downloads.get(id);

// remove this
this.taskIds.forEach(function(value, key) {
  console.log("always correct context in start:");
  console.log(key + ' = ' + value);
});
// end remove this

                    if (request) {
                        request.setListener(this.listener);

                        // const listener = co.fitcom.fancydownloader.DownloadListenerUI.extend({
                        //     onUIProgress(task, currentBytes, totalBytes, speed) {
                        //         const current = Math.floor(Math.round(currentBytes / totalBytes * 100));
                        //         const owner = ref;//.get();
                        //         const _id = owner.taskIds.get(task);
                        //         if (owner.downloads.has(_id)) {
                        //             const data = owner.downloadsData.get(_id);
                        //             const callback = data.callback;
                        //             if (data.status !== StatusCode.DOWNLOADING) {
                        //                 owner.downloadsData.set(_id, Object.assign({}, data, {
                        //                     status: StatusCode.DOWNLOADING
                        //                 }));
                        //             }
                        //             if (callback && typeof callback === 'function') {
                        //                 callback({
                        //                     value: current,
                        //                     speed: speed,
                        //                     currentSize: currentBytes,
                        //                     totalSize: totalBytes
                        //                 });
                        //             }
                        //         }
                        //     },
                        //     onUIComplete(task) {
                        //         const owner = ref;//.get();
                        //         const _id = owner.taskIds.get(task);
                        //         if (owner.downloads.has(_id)) {
                        //             const data = owner.downloadsData.get(_id);
                        //             const resolve = data.resolve;
                        //             const _request = owner.downloadRequests.get(_id);
                        //             if (resolve) {
                        //                 resolve({
                        //                     status: StatusCode.COMPLETED,
                        //                     path: fs.path.join(_request.getFilePath(), _request.getFileName())
                        //                 });
                        //             }
                        //         }
                        //     },
                        //     onUIError(task, error) {
                        //         const owner = ref;//.get();
                        //         const _id = owner.taskIds.get(task);
                        //         if (owner.downloads.has(_id)) {
                        //             const data = owner.downloadsData.get(_id);
                        //             const reject = data.reject;
                        //             const message = error.getLocalizedMessage();
                        //             if (reject) {
                        //                 if (message.toLowerCase().indexOf('socket closed') === -1) {
                        //                     reject({
                        //                         status: StatusCode.ERROR,
                        //                         message: error.getLocalizedMessage()
                        //                     });
                        //                 }
                        //             }
                        //         }
                        //     }
                        // });
                        // request.setListener(new listener());
                    }
                    this.manager.start(downloadId);
                }
            }
        });
    }
    resume(id) {
        if (id) {
            if (this.downloads.has(id)) {
                const downloadId = this.downloads.get(id);
                this.manager.resume(downloadId);
            }
        }
    }
    cancel(id) {
        if (id) {
            if (this.downloads.has(id)) {
                const downloadId = this.downloads.get(id);
                this.manager.cancel(downloadId);
                this.downloads.delete(id);
                this.downloadsData.delete(id);
            }
        }
    }
    pause(id) {
        if (id) {
            if (this.downloads.has(id)) {
                const downloadId = this.downloads.get(id);
                const data = this.downloadsData.get(id);
                this.manager.pause(downloadId);
                setTimeout(() => {
                    this.downloadsData.set(id, Object.assign({}, data, {
                        status: StatusCode.PAUSED
                    }));
                }, 100);
            }
        }
    }
    getPath(id) {
        if (id && this.downloadsData.has(id)) {
            const download = this.downloadsData.get(id);
            return download.path;
        }
        return null;
    }
}
