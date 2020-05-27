var _ = require("lodash");

Object.defineProperty(exports, "__esModule", { value: true });

function debugObservers(observers) {
    return _(observers)
        .map((v, k) => {
            return [k, v.length];
        })
        .fromPairs()
        .value();
}

var Observable = (function() {
    function Observable() {
        this._observers = {};
    }
    Observable.prototype.on = function(eventNames, callback, thisArg) {
        this.addEventListener(eventNames, callback, thisArg);
    };
    Observable.prototype.once = function(event, callback, thisArg) {
        var list = this._getEventList(event, true);
        list.push({ callback: callback, thisArg: thisArg, once: true });
    };
    Observable.prototype.off = function(eventNames, callback, thisArg) {
        this.removeEventListener(eventNames, callback, thisArg);
    };
    Observable.prototype.addEventListener = function(eventNames, callback, thisArg) {
        if (typeof eventNames !== "string") {
            throw new TypeError("Events name(s) must be string.");
        }
        if (typeof callback !== "function") {
            throw new TypeError("callback must be function.");
        }
        console.log(this.constructor.name, "addEventListener", eventNames);
        var events = eventNames.split(",");
        for (var i = 0, l = events.length; i < l; i++) {
            var event_1 = events[i].trim();
            var list = this._getEventList(event_1, true);
            list.push({
                callback: callback,
                thisArg: thisArg,
            });
        }
        console.log(this.constructor.name, "addEventListener", eventNames, debugObservers(this._observers));
    };
    Observable.prototype.removeEventListener = function(eventNames, callback, thisArg) {
        if (typeof eventNames !== "string") {
            throw new TypeError("Events name(s) must be string.");
        }
        if (callback && typeof callback !== "function") {
            throw new TypeError("callback must be function.");
        }
        console.log(this.constructor.name, "removeEventListener", eventNames, debugObservers(this._observers));
        var events = eventNames.split(",");
        for (var i = 0, l = events.length; i < l; i++) {
            var event_2 = events[i].trim();
            if (callback) {
                var list = this._getEventList(event_2, false);
                if (list) {
                    var index_1 = this._indexOfListener(list, callback, thisArg);
                    if (index_1 >= 0) {
                        list.splice(index_1, 1);
                    }
                    if (list.length === 0) {
                        delete this._observers[event_2];
                    }
                }
            } else {
                this._observers[event_2] = undefined;
                delete this._observers[event_2];
            }
        }
        console.log(this.constructor.name, "removeEventListener", eventNames, debugObservers(this._observers));
    };
    Observable.prototype.notify = function(data) {
        let values = [];
        var observers = this._observers[data.eventName];
        if (!observers) {
            return Promise.all(values);
        }

        console.log(this.constructor.name, "notify", debugObservers(this._observers));
        for (var i = observers.length - 1; i >= 0; i--) {
            var entry = observers[i];
            if (entry.once) {
                observers.splice(i, 1);
            }
            if (entry.thisArg) {
                values.push(entry.callback.apply(entry.thisArg, [data]));
            } else {
                values.push(entry.callback(data));
            }
        }

        return Promise.all(values);
    };
    Observable.prototype.notifyPropertyChange = function(name, value, oldValue) {
        return this.notify(this._createPropertyChangeData(name, value, oldValue));
    };
    Observable.prototype.hasListeners = function(eventName) {
        return eventName in this._observers;
    };
    Observable.prototype._createPropertyChangeData = function(propertyName, value, oldValue) {
        return { eventName: Observable.propertyChangeEvent, object: this, propertyName: propertyName, value: value, oldValue: oldValue };
    };
    Observable.prototype._emit = function(eventNames) {
        var events = eventNames.split(",");
        for (var i = 0, l = events.length; i < l; i++) {
            var event_3 = events[i].trim();
            this.notify({ eventName: event_3, object: this });
        }
    };
    Observable.prototype._getEventList = function(eventName, createIfNeeded) {
        if (!eventName) {
            throw new TypeError("EventName must be valid string.");
        }
        var list = this._observers[eventName];
        if (!list && createIfNeeded) {
            list = [];
            this._observers[eventName] = list;
        }
        return list;
    };
    Observable.prototype._indexOfListener = function(list, callback, thisArg) {
        for (var i = 0; i < list.length; i++) {
            var entry = list[i];
            if (thisArg) {
                if (entry.callback === callback && entry.thisArg === thisArg) {
                    return i;
                }
            } else {
                if (entry.callback === callback) {
                    return i;
                }
            }
        }
        return -1;
    };
    Observable.propertyChangeEvent = "propertyChange";
    return Observable;
})();
exports.Observable = Observable;
//# sourceMappingURL=observable.js.map
