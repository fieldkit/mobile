import { Application, Device } from "@nativescript/core";
import { debug } from "./debugging";

const strRender = require("str-render");

const i18n = {
    defaults: {},
    strings: {},
};

export function translate(strName, ...replacers): string {
    let res;

    if (i18n.strings.hasOwnProperty(strName)) {
        res = i18n.strings[strName];
    } else if (i18n.defaults.hasOwnProperty(strName)) {
        res = i18n.defaults[strName];
    } else {
        res = deepAccessUsingString(i18n.strings, strName);
        if (res === undefined) {
            res = deepAccessUsingString(i18n.defaults, strName);
        }
    }

    if (res === undefined) {
        res = "";
    }

    return strRender(res, "%s", ...replacers);
}

export function initializeI18n(defaultLang: string) {
    const lang = Device.language;

    i18n.defaults = require("~/locales/" + defaultLang);

    try {
        i18n.strings = require("~/locales/" + lang);
    } catch (e) {
        debug.log("error loading/missing:", lang);
    }

    const applicationResources = Application.getResources();
    Application.setResources(applicationResources);
}

export function changeLanguageI18n(lang: string) {
    try {
        i18n.defaults = require("~/locales/" + lang);

        i18n.strings = require("~/locales/" + lang);
        const applicationResources = Application.getResources();
        Application.setResources(applicationResources);
        Application.getRootView();
    } catch (e) {
        debug.log("error changing:", lang);
    }
}

function deepAccessUsingString(obj, key) {
    return key.split(".").reduce((nestedObject, key) => {
        if (nestedObject && key in nestedObject) {
            return nestedObject[key];
        }
        return undefined;
    }, obj);
}
