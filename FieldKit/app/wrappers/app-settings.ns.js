import { getString, setString, getNumber, setNumber, remove } from "tns-core-modules/application-settings";

export default class AppSettingsNativeScript {
    constructor() {}

    getString(string) {
        return getString(string);
    }

    setString(stringKey, stringValue) {
        return setString(stringKey, stringValue);
    }

    getNumber(numKey) {
        return getNumber(numKey);
    }

    setNumber(numKey, numValue) {
        return setNumber(numKey, numValue);
    }

    remove(string) {
        return remove(string);
    }
}
