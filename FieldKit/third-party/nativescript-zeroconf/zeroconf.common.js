"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var observable_1 = require("tns-core-modules/data/observable");
var Common = (function (_super) {
    __extends(Common, _super);
    function Common(serviceType) {
        var _this = _super.call(this) || this;
        _this.serviceType = serviceType;
        return _this;
    }
    Common.prototype.startServiceDiscovery = function () { };
    ;
    Common.prototype.stopServiceDiscovery = function () { };
    ;
    Common.prototype.onServiceFound = function (service) {
        this.notifyPropertyChange('serviceFound', service);
    };
    Common.prototype.onServiceLost = function (service) {
        this.notifyPropertyChange('serviceLost', service);
    };
    return Common;
}(observable_1.Observable));
exports.Common = Common;
//# sourceMappingURL=zeroconf.common.js.map