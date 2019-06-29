"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var zeroconf_common_1 = require("./zeroconf.common");
var delegate = null;
var services = [];
var Zeroconf = (function (_super) {
    __extends(Zeroconf, _super);
    function Zeroconf(serviceType) {
        var _this = _super.call(this, serviceType) || this;
        _this.netServiceBrowser = NSNetServiceBrowser.new();
        return _this;
    }
    Zeroconf.prototype.startServiceDiscovery = function () {
        var _this = this;
        delegate = MyNSNetServiceBrowserDelegate.new().initWithCallback(function (result) {
            if (result.type === 'service') {
                console.log('service', result.data.name, result.data.type);
                if (result.removed) {
                    var service = {
                        'name': result.data.name,
                        'type': result.data.type,
                    };
                    _this.onServiceLost(service);
                }
                else {
                    _this.resolveBonjourService(result.data);
                }
            }
            if (result.type === 'resolve') {
                _this.processBonjourService(result.data);
            }
        });
        this.netServiceBrowser.delegate = delegate;
        this.netServiceBrowser.searchForServicesOfTypeInDomain(this.serviceType, 'local.');
    };
    Zeroconf.prototype.stopServiceDiscovery = function () {
        this.stopDiscovery();
    };
    Zeroconf.prototype.stopDiscovery = function () {
        this.netServiceBrowser.stop();
    };
    Zeroconf.prototype.resolveBonjourService = function (result) {
        console.log("resolving", result.name, result.type);
        result.delegate = delegate;
        result.stop();
        result.resolveWithTimeout(10.0);
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
        return this;
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserDidFindDomainMoreComing = function (browser, domainString, moreComing) {
        console.log("netServiceBrowserDidFindDomainMoreComing: " + domainString);
        this._callback({
            'type': 'domain',
            'data': domainString,
            'moreComing': moreComing
        });
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserWillSearch = function (browser) {
        console.log("netServiceBrowserWillSearch");
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserDidStopSearch = function (browser) {
        console.log("netServiceBrowserDidStopSearch");
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceBrowserDidFindServiceMoreComing = function (browser, service, moreComing) {
        console.log("netServiceBrowserDidFindServiceMoreComing, found service " + service.name + " " + service.type);
        service.retain();
        service.delegate = this;
        service.stop();
        service.resolveWithTimeout(10.0);
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
    MyNSNetServiceBrowserDelegate.prototype.netServiceWillResolve = function (sender) {
        console.log("netServiceWillResolve " + sender.name + " " + sender.type);
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceDidNotResolve = function (sender, errorDict) {
        console.log("netServiceDidNotResolve " + sender.name + " " + sender.type);
    };
    MyNSNetServiceBrowserDelegate.prototype.netServiceDidResolveAddress = function (sender) {
        console.log("netServiceDidResolveAddress " + sender.name + " " + sender.type);
        this._callback({
            'type': 'resolve',
            'data': sender
        });
    };
    MyNSNetServiceBrowserDelegate.ObjCProtocols = [NSNetServiceBrowserDelegate, NSNetServiceDelegate];
    return MyNSNetServiceBrowserDelegate;
}(NSObject));
//# sourceMappingURL=zeroconf.ios.js.map