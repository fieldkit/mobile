import _ from "lodash";
import moment from "moment";

// From https://matthiashager.com/converting-snake-case-to-camel-case-object-keys-with-javascript
const isObject = function(o) {
    return o === Object(o) && !isArray(o) && typeof o !== "function";
};
const isArray = function(a) {
    return Array.isArray(a);
};
const toCamel = s => {
    return s.replace(/([-_][a-z])/gi, $1 => {
        return $1
            .toUpperCase()
            .replace("-", "")
            .replace("_", "");
    });
};
export function keysToCamel(o) {
    if (isObject(o)) {
        const n = {};

        Object.keys(o).forEach(k => {
            n[toCamel(k)] = keysToCamel(o[k]);
        });

        return n;
    } else if (isArray(o)) {
        return o.map(i => {
            return keysToCamel(i);
        });
    }

    return o;
}

export function sqliteToJs(o) {
    // TODO Handle booleans.
    return keysToCamel(o);
}

export function getPathTimestamp() {
    return moment()
        .utc()
        .format("YYYYMMDD_hhmmss");
}

export function serializePromiseChain(all, fn) {
    return all.reduce((accum, value, index) => {
        return accum.then(allValues => {
            return fn(value, index).then(singleValue => {
                allValues.push(singleValue);
                return allValues;
            });
        });
    }, Promise.resolve([]));
}

export function promiseAfter(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t);
    });
}

export function hexStringToByteWiseString(str) {
    return str
        .split("")
        .map((c, i) => {
            return (i + 1) % 2 == 0 ? c + " " : c;
        })
        .join("");
}

export function convertBytesToLabel(bytes) {
    // convert to kilobytes or megabytes
    if (bytes < 1000000.0) {
        return Math.round(bytes / 1024.0) + " KB";
    }
    return Math.round(bytes / 1048576.0) + " MB";
}

export function unixNow() {
    return Math.round(new Date().getTime() / 1000);
}

export function getLastSeen(date) {
    if (!date) {
        return "";
    }
    if (date && typeof date == "string") {
        date = new Date(date);
    }
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let year = date.getFullYear();
    let today = new Date();
    // if same day, return time instead
    if (today.getMonth() + 1 == month && today.getDate() == day && today.getFullYear() == year) {
        return getFormattedTime(date);
    }
    return month + "/" + day + "/" + year;
}

export function getFormattedTime(date) {
    if (!date) {
        return "";
    }
    if (date && typeof date == "string") {
        date = new Date(date);
    }
    const origHour = date.getHours();
    const suffix = origHour < 12 ? " AM" : " PM";
    const hour = origHour % 12 == 0 ? 12 : origHour % 12;
    let origMinutes = date.getMinutes();
    const minutes = origMinutes < 10 ? "0" + origMinutes : origMinutes;
    return hour + ":" + minutes + suffix;
}

export function _T(key) {
    const value = _L(key);
    if (value) {
        return value;
    }
    const parts = key.split(".");
    let node = _T(parts.shift());
    while (parts.length > 0) {
        node = node[parts.shift()];
    }
    return node;
}

export function convertOldFirmwareResponse(module) {
    // compensate for old firmware
    if (module.name.indexOf("modules") != 0) {
        module.name = "modules." + module.name;
        if (module.name == "modules.water") {
            // this is dicey, but temporary...
            module.name += "." + module.sensorObjects[0].name;
        }
    }
    return module.name;
}

const lastRunTimes = {};

export function onlyAllowEvery(seconds, action, otherwise) {
    const id = _.uniqueId();
    lastRunTimes[id] = 0;
    return () => {
        const now = unixNow();
        if (now - lastRunTimes[id] > seconds) {
            lastRunTimes[id] = now;
            return action();
        } else {
            console.log("onlyAllowEvery throttled");
            return Promise.resolve(otherwise());
        }
    };
}
