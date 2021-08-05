// eslint-disable-next-line
import { ApplicationSettings } from "@nativescript/core";

export default class AppSettings {

    public getString(key: string): string {
        return ApplicationSettings.getString(key) ;
    }

    public setString(key: string, value: string): void {
        ApplicationSettings.setString(key, value);
    }

    public getNumber(key: string, defaultValue?: number): number {
        return ApplicationSettings.getNumber(key, defaultValue);
    }

    public setNumber(key: string, value: number): void {
        ApplicationSettings.setNumber(key, value);
    }

    public remove(key: string): void {
        ApplicationSettings.remove(key);
    }
}
