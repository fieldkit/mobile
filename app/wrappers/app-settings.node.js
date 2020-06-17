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

    getNumber(numKey) {
        return this.strings[numKey];
    }

    setNumber(numKey, numValue) {
        this.strings[numKey] = numValue;
        return numValue;
    }

    remove(string) {
        delete this.strings[string];
        return;
    }
}
