"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("tns-core-modules/data/observable");
var DownloaderBase = (function (_super) {
    __extends(DownloaderBase, _super);
    function DownloaderBase() {
        return _super.call(this) || this;
    }
    return DownloaderBase;
}(observable_1.Observable));
exports.DownloaderBase = DownloaderBase;
function generateId() {
    return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.generateId = generateId;
var StatusCode;
(function (StatusCode) {
    StatusCode["PENDING"] = "pending";
    StatusCode["PAUSED"] = "paused";
    StatusCode["DOWNLOADING"] = "downloading";
    StatusCode["COMPLETED"] = "completed";
    StatusCode["ERROR"] = "error";
})(StatusCode = exports.StatusCode || (exports.StatusCode = {}));
//# sourceMappingURL=downloader.common.js.map