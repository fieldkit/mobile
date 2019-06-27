"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zeroconf_common_1 = require("./zeroconf.common");
var delegate = null;
var Zeroconf = (function (_super) {
    __extends(Zeroconf, _super);
    function Zeroconf(serviceType) {
        var _this = _super.call(this, serviceType) || this;
        _this.netServiceBrowser = NSNetServiceBrowser.new();
        return _this;
    }
    Zeroconf.prototype.startServiceDiscovery = function () {
        var _this = this;
        this.netServiceBrowser.delegate = MyNSNetServiceBrowserDelegate.new().initWithCallback(function (result) {
            if (result.type === 'service') {
                if (result.removed) {
                    var service = {
                        'name': result.name,
                        'type': result.type,
                    };
                    _this.onServiceLost(service);
                }
                else {
                    _this.resolveBonjourService(result.data);
                }
            }
        });
        this.netServiceBrowser.searchForServicesOfTypeInDomain(this.serviceType, 'local.');
    };
    Zeroconf.prototype.stopServiceDiscovery = function () {
        this.stopDiscovery();
    };
    Zeroconf.prototype.stopDiscovery = function () {
        this.netServiceBrowser.stop();
    };
    Zeroconf.prototype.resolveBonjourService = function (result) {
        var _this = this;
        result.delegate = MyNSNetServiceDelegate.new().initWithCallback(function (result) {
            if (result.type === 'resolve') {
                _this.processBonjourService(result.data);
            }
        });
        result.resolveWithTimeout(0.0);
    };
    Zeroconf.prototype.processBonjourService = function (result) {
        if (result.addresses.count < 1) {
            console.warn("processBonjourService: did not resolve any IP addresses for " + result.name + "!");
        }
        var service = {
            'name': result.name,
            'type': result.type,
            'host': result.hostName,
            'port': result.port,
        };
        this.onServiceFound(service);
    };
    return Zeroconf;
}(zeroconf_common_1.Common));
exports.Zeroconf = Zeroconf;
var MyNSNetServiceBrowserDelegate = (function (_super) {
    __extends(MyNSNetServiceBrowserDelegate, _super);
    function MyNSNetServiceBrowserDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MyNSNetServiceBrowserDelegate.new = function () {
        return _super.new.call(this);
    };
    MyNSNetServiceBrowserDelegate.prototype.initWithCallback = function (callback) {
        this._callback = callback;
        delegate = this;
        return this;
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserDidFindDomainMoreComing = function (browser, domainString, moreComing) {
        this._callback({
            'type': 'domain',
            'data': domainString,
            'moreComing': moreComing
        });
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserWillSearch = function (browser) {
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserDidStopSearch = function (browser) {
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserDidFindServiceMoreComing = function (browser, service, moreComing) {
        console.log("netServiceBrowserDidFindServiceMoreComing, found service " + service.name + " " + service.type);
        this._callback({
            'removed': false,
            'type': 'service',
            'data': service,
            'moreComing': moreComing
        });
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserDidRemoveServiceMoreComing = function (browser, service, moreComing) {
        console.log("netServiceBrowserDidRemoveServiceMoreComing, removed service " + service.name + " " + service.type);
        this._callback({
            'removed': true,
            'type': 'service',
            'data': service,
            'moreComing': moreComing
        });
    };
    MyNSNetServiceBrowserDelegate.ObjCProtocols = [NSNetServiceBrowserDelegate];
    return MyNSNetServiceBrowserDelegate;
}(NSObject));
var MyNSNetServiceDelegate = (function (_super) {
    __extends(MyNSNetServiceDelegate, _super);
    function MyNSNetServiceDelegate() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MyNSNetServiceDelegate.new = function () {
        return _super.new.call(this);
    };
    MyNSNetServiceDelegate.prototype.initWithCallback = function (callback) {
        this._callback = callback;
        return this;
    };
    MyNSNetServiceDelegate.prototype.netServiceWillResolve = function (sender) {
    };
    MyNSNetServiceDelegate.prototype.netServiceDidNotResolve = function (sender, errorDict) {
        console.log("netServiceDidNotResolve");
    };
    MyNSNetServiceDelegate.prototype.netServiceDidResolveAddress = function (sender) {
        this._callback({
            'type': 'resolve',
            'data': sender
        });
    };
    MyNSNetServiceDelegate.ObjCProtocols = [NSNetServiceDelegate];
    return MyNSNetServiceDelegate;
}(NSObject));
//# sourceMappingURL=zeroconf.ios.js.map