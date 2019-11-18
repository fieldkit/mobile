import { getString, setString, remove } from "tns-core-modules/application-settings";

export default class AppSettingsNativeScript {
    constructor() {
    }

    getString(string) {
        return getString(string);
    }

    setString(stringKey, stringValue) {
        return setString(stringKey, stringValue);
    }

    remove(string) {
        return remove(string);
    }
}
