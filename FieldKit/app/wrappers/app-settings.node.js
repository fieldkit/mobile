export default class AppSettingsNode {
    constructor() {
        this.strings = {};
    }

    getString(string) {
        return this.strings[string];
    }

    setString(stringKey, stringValue) {
        this.strings[stringKey] = stringValue;
        return stringValue;
    }

    remove(string) {
        delete this.strings[string];
        return;
    }
}
