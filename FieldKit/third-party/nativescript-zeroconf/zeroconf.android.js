"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zeroconf_common_1 = require("./zeroconf.common");
var async = require("async");
var Zeroconf = (function (_super) {
    __extends(Zeroconf, _super);
    function Zeroconf(serviceType) {
        var _this = _super.call(this, serviceType) || this;
        _this.context = android.content.Context;
        _this.mNsdManager = _this.getAndroidContext().getSystemService(_this.context.NSD_SERVICE);
        _this.NsdManager = android.net.nsd.NsdManager;
        return _this;
    }
    Zeroconf.prototype.startServiceDiscovery = function () {
        var _this = this;
        var asyncQueue = async.queue(function (serviceInfo, callback) {
            _this.resolveService(serviceInfo).then(function (service) {
                _this.onServiceFound(service);
                callback();
            }).catch(function (error) {
                console.error("Error #" + error + " occured during resolving discovered device " + serviceInfo.getServiceName());
            });
        }, 1);
        this.mDiscoveryListener = new this.NsdManager.DiscoveryListener({
            onDiscoveryStarted: function (serviceType) {
            },
            onStartDiscoveryFailed: function (serviceType, errorCode) {
                console.error("onStartDiscoveryFailed with error #" + errorCode);
            },
            onStopDiscoveryFailed: function (serviceType, errorCode) {
                console.error("onStopDiscoveryFailed with error #" + errorCode);
            },
            onDiscoveryStopped: function (serviceType) {
            },
            onServiceFound: function (serviceInfo) {
                asyncQueue.push(serviceInfo, function (err) {
                });
            },
            onServiceLost: function (serviceInfo) {
                _this.onServiceLost({
                    'name': serviceInfo.getServiceName(),
                    'type': serviceInfo.getServiceType(),
                });
            }
        });
        this.mNsdManager.discoverServices(this.serviceType, this.NsdManager.PROTOCOL_DNS_SD, this.mDiscoveryListener);
    };
    Zeroconf.prototype.stopServiceDiscovery = function () {
        this.mNsdManager.stopServiceDiscovery(this.mDiscoveryListener);
    };
    Zeroconf.prototype.resolveService = function (serviceInfo) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var mResolveListener = new _this.NsdManager.ResolveListener({
                onResolveFailed: function (serviceInfo, errorCode) {
                    reject(errorCode);
                },
                onServiceResolved: function (serviceInfo) {
                    resolve({
                        'name': serviceInfo.getServiceName(),
                        'type': serviceInfo.getServiceType(),
                        'host': serviceInfo.getHost().getHostAddress(),
                        'port': serviceInfo.getPort(),
                    });
                }
            });
            _this.mNsdManager.resolveService(serviceInfo, mResolveListener);
        });
    };
    Zeroconf.prototype.getAndroidContext = function () {
        var ctx = java.lang.Class.forName("android.app.AppGlobals").getMethod("getInitialApplication", null).invoke(null, null);
        if (ctx) {
            return ctx;
        }
        ctx = java.lang.Class.forName("android.app.ActivityThread").getMethod("currentApplication", null).invoke(null, null);
        return ctx;
    };
    return Zeroconf;
}(zeroconf_common_1.Common));
exports.Zeroconf = Zeroconf;
//# sourceMappingURL=zeroconf.android.js.map