// From https://matthiashager.com/converting-snake-case-to-camel-case-object-keys-with-javascript

import moment from 'moment';

const isObject = function (o) {
    return o === Object(o) && !isArray(o) && typeof o !== 'function';
};
const isArray = function (a) {
    return Array.isArray(a);
};
const toCamel = (s) => {
    return s.replace(/([-_][a-z])/ig, ($1) => {
        return $1.toUpperCase()
            .replace('-', '')
            .replace('_', '');
    });
};
export function keysToCamel(o) {
    if (isObject(o)) {
        const n = {};

        Object.keys(o).forEach((k) => {
            n[toCamel(k)] = keysToCamel(o[k]);
        });

        return n;
    }
    else if (isArray(o)) {
        return o.map((i) => {
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
    return moment().utc().format('YYYYMMDD_hhmmss');
}

export function serializePromiseChain(all, fn) {
    return all.reduce((accum, value, index) => {
        return accum.then((allValues) => {
            return fn(value, index).then((singleValue) => {
                allValues.push(singleValue);
                return allValues;
            });
        });
    }, Promise.resolve([]));
}

export function promiseAfter(t, v) {
    return new Promise(function(resolve) {
        setTimeout(resolve.bind(null, v), t)
    });
}
