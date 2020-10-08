const appSettings = require("tns-core-modules/application-settings");

export default class AppSettings {
    public getString(key: string) {
        return appSettings.getString(key);
    }

    public setString(stringKey: string, stringValue: string) {
        return appSettings.setString(stringKey, stringValue);
    }

    public getNumber(numKey: string) {
        return appSettings.getNumber(numKey);
    }

    public setNumber(numKey: string, numValue: number) {
        return appSettings.setNumber(numKey, numValue);
    }

    public remove(key: string) {
        return appSettings.remove(key);
    }
}
