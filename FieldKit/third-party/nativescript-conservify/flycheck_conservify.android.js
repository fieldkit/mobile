"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var conservify_common_1 = require("./conservify.common");
var application_1 = require("tns-core-modules/application");
var Conservify = (function (_super) {
    __extends(Conservify, _super);
    function Conservify() {
        return _super.call(this) || this;
    }
    Conservify.prototype.initialize = function () {
        console.log("initialize");
        var networkingListener = new org.conservify.networking.NetworkingListener({
            onFoundService: function (service) {
                console.log("onFoundService", service);
            },
            onLostService: function (service) {
                console.log("onLostService", service);
            },
            onNetworkChanged: function (network) {
                console.log("onNetworkChanged", network);
            },
            onNetworksFound: function (networks) {
                console.log("onNetworksFound", networks);
            },
        });
        var uploadListener = new org.conservify.networking.WebTransferListener({
            onStarted: function (task, headers) {
                console.log("upload:onStarted", task, headers);
            },
            onProgress: function (task, bytes, total) {
                console.log("upload:onProgress", task, bytes, total);
            },
            onComplete: function (task, headers, statusCode) {
                console.log("upload:onComplete", task, headers, statusCode);
            },
            onError: function (task) {
                console.log("upload:onError", task);
            }
        });
        var downloadListener = new org.conservify.networking.WebTransferListener({
            onStarted: function (task, headers) {
                console.log("download:onStarted", task, headers);
            },
            onProgress: function (task, bytes, total) {
                console.log("download:onProgress", task, bytes, total);
            },
            onComplete: function (task, headers, statusCode) {
                console.log("download:onComplete", task, headers, statusCode);
            },
            onError: function (task) {
                console.log("download:onError", task);
            }
        });
        this.networking = new org.conservify.networking.Networking(application_1.android.context, this.networkingListener, this.uploadListener, this.downloadListener);
        console.log("ready");
    };
    return Conservify;
}(conservify_common_1.Common));
exports.Conservify = Conservify;
//# sourceMappingURL=flycheck_conservify.android.js.map