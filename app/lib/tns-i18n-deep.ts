import { Application, Device } from "@nativescript/core";

var strRender = require("str-render");

export default function (defaultLang) {
    const lang = Device.language;
    const defaults = require("~/i18n/" + defaultLang);

    let strings = {};
    try {
        strings = require("~/i18n/" + lang);
    } catch (e) {
        console.log("error loading/missing:", lang);
    }

    const _L = function (strName, ...replacers) {
        var res;
        if (strings.hasOwnProperty(strName)) {
            res = strings[strName];
        } else if (defaults.hasOwnProperty(strName)) {
            res = defaults[strName];
        } else {
            res = deepAccessUsingString(strings, strName);
            if (res === undefined) {
                res = deepAccessUsingString(defaults, strName);
            }
        }
        if (res === undefined) {
            res = "";
        }

        return strRender(res, "%s", ...replacers);
    };

    const applicationResources = Application.getResources();
    applicationResources._L = _L;
    Application.setResources(_L);
    Application.setResources(applicationResources);
    global._L = _L;
}

function deepAccessUsingString(obj, key) {
    return key.split(".").reduce((nestedObject, key) => {
        if (nestedObject && key in nestedObject) {
            return nestedObject[key];
        }
        return undefined;
    }, obj);
}
