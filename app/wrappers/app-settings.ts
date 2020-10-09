const appSettings = require("tns-core-modules/application-settings");

export default class AppSettings {
    public getString(key: string): string {
        return appSettings.getString(key);
    }

    public setString(key: string, value: string): void {
        appSettings.setString(key, value);
    }

    public getNumber(key: string): number {
        return appSettings.getNumber(key);
    }

    public setNumber(key: string, value: number): void {
        appSettings.setNumber(key, value);
    }

    public remove(key: string): void {
        appSettings.remove(key);
    }
}
