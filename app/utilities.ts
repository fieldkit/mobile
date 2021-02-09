import _ from "lodash";
import Bluebird from "bluebird";

// From https://matthiashager.com/converting-snake-case-to-camel-case-object-keys-with-javascript
// eslint-disable-next-line
const isObject = function (o: any): boolean {
    return o === Object(o) && !isArray(o) && typeof o !== "function";
};
// eslint-disable-next-line
const isArray = function (a: any): boolean {
    return Array.isArray(a);
};
// eslint-disable-next-line
const toCamel = (s: string): string => {
    return s.replace(/([-_][a-z])/gi, ($1) => {
        return $1.toUpperCase().replace("-", "").replace("_", "");
    });
};
// eslint-disable-next-line
export function keysToCamel(o: any): any {
    if (isObject(o)) {
        const n = {};

        Object.keys(o).forEach((k) => {
            // eslint-disable-next-line
            n[toCamel(k)] = keysToCamel(o[k]);
        });

        return n;
    } else if (isArray(o)) {
        // eslint-disable-next-line
        return o.map((i: any) => {
            return keysToCamel(i); // eslint-disable-line
        });
    }

    return o; // eslint-disable-line
}

// eslint-disable-next-line
export function sqliteToJs<T>(o: any[]): T[] {
    return keysToCamel(o) as T[]; // eslint-disable-line
}

export type SerializeFunc<V, R> = (value: V, index: number) => Promise<R>;

export function serializePromiseChain<V, R>(all: V[], fn: SerializeFunc<V, R>): Promise<R[]> {
    return all.reduce((accum: Promise<R[]>, value: V, index: number) => {
        return accum.then((allValues: R[]) => {
            return Bluebird.resolve(fn(value, index)).then((singleValue: R) => {
                allValues.push(singleValue);
                return allValues;
            });
        });
    }, Bluebird.resolve([]) as Promise<R[]>);
}

export function promiseAfter<V>(t: number, v?: V): Promise<V> {
    return Bluebird.delay(t).then(() => v);
}

export function hexStringToByteWiseString(str: string): string {
    return str
        .split("")
        .map((c: string, i: number) => {
            return (i + 1) % 2 == 0 ? c + " " : c;
        })
        .join("");
}

export class LabelledElapsedTime {
    constructor(public readonly time: string, public readonly label: string) {}
}

export function getLabelledElapsedTime(a: Date, b: Date): LabelledElapsedTime {
    const elapsed = (a.getTime() - b.getTime()) / 1000;
    const seconds = Math.floor(elapsed % 60);
    const minutes = Math.floor((elapsed / 60) % 60);
    const hours = Math.floor((elapsed / (60 * 60)) % 24);
    const days = Math.floor(elapsed / (60 * 60 * 24));

    const secondsStr = seconds < 10 ? `0${seconds}` : seconds;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const hoursStr = hours < 10 ? `0${hours}` : hours;

    if (days > 1) {
        return new LabelledElapsedTime(`${days}:${hoursStr}:${minutesStr}`, _L("daysHrsMin"));
    } else {
        return new LabelledElapsedTime(`${hoursStr}:${minutesStr}:${secondsStr}`, _L("hrsMinSec"));
    }
}

export function convertBytesToLabel(bytes: number): string {
    // convert to kilobytes or megabytes
    if (bytes < 1000000.0) {
        return `${Math.round(bytes / 1024.0)} KB`;
    }
    return `${Math.round(bytes / 1048576.0)} MB`;
}

export function unixNow(): number {
    return Math.round(new Date().getTime() / 1000);
}

export function getLastSeen(date: Date | string | null): string {
    if (!date) {
        return "";
    }
    if (typeof date == "string") {
        date = new Date(date);
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const today = new Date();
    // if same day, return time instead
    if (today.getMonth() + 1 == month && today.getDate() == day && today.getFullYear() == year) {
        return getFormattedTime(date);
    }
    return `${month}/${day}/${year}`;
}

export function getFormattedTime(date: Date): string {
    if (!date) {
        return "";
    }
    if (date && typeof date == "string") {
        date = new Date(date);
    }
    const origHour = date.getHours();
    const suffix = origHour < 12 ? " AM" : " PM";
    const hour = origHour % 12 == 0 ? 12 : origHour % 12;
    const origMinutes = date.getMinutes();
    const minutes = origMinutes < 10 ? `0${origMinutes}` : origMinutes;
    return `${hour}:${minutes}${suffix}`;
}

export function _T(key: string): string {
    const value: string | undefined = _L(key);
    if (value) return value;
    const parts: string[] = key.split(".");
    if (parts.length == 0) throw new Error(`invalid _T key: ${key}`);
    let word = parts.shift()!; // eslint-disable-line
    if (!word) throw new Error(`error finding key: ${key}`);
    let node = _T(word);
    while (parts.length > 0) {
        word = parts.shift()!; // eslint-disable-line
        if (!word) throw new Error(`error finding key: ${key}`);
        node = node[word]; // eslint-disable-line
    }
    if (!node) throw new Error(`error finding key: ${key}`);
    return node;
}

export function convertOldFirmwareResponse(module: { name: string; sensors: { name: string }[] }): string {
    // compensate for old firmware
    if (module.name.indexOf("modules") != 0) {
        module.name = "modules." + module.name;
        if (module.name == "modules.water") {
            // this is dicey, but temporary...
            module.name += "." + module.sensors[0].name;
        }
    }
    return module.name;
}

const lastRunTimes: { [index: string]: number } = {};

export function onlyAllowEvery<V>(seconds: number, action: () => Promise<V>, otherwise: () => V): () => Promise<V> {
    const id = _.uniqueId();
    lastRunTimes[id] = 0;
    return () => {
        const now = unixNow();
        if (now - lastRunTimes[id] > seconds) {
            lastRunTimes[id] = now;
            return action();
        } else {
            console.log("onlyAllowEvery throttled");
            return Bluebird.resolve(otherwise());
        }
    };
}

export function validateStationName(name: string): { required: boolean; long: boolean; any: boolean; characters: boolean } {
    const matches = /^[ \w\d~!@#$%^&*()-.'`]*$/.exec(name);
    const required = name.length == 0;
    const characters = !matches || matches.length == 0;
    const long = name.length > 40;
    const any = required || long || characters;
    return {
        required: required,
        long: long,
        characters: characters,
        any: any,
    };
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
    return value !== null && value !== undefined;
}
