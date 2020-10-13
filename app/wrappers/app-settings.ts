interface Settings {
    getString(key: string): string;
    getNumber(key: string): number;
    setString(key: string, value: string): void;
    setNumber(key: string, value: number): void;
    remove(key: string): void;
}

const appSettings = require("tns-core-modules/application-settings") as Settings;

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
