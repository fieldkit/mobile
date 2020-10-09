export default class AppSettings {
    static numbers: { [index: string]: number } = {};
    static strings: { [index: string]: string } = {};

    public getString(key: string): string {
        return AppSettings.strings[key];
    }

    public setString(key: string, value: string): void {
        AppSettings.strings[key] = value;
    }

    public getNumber(key: string): number {
        return AppSettings.numbers[key];
    }

    public setNumber(key: string, value: number): void {
        AppSettings.numbers[key] = value;
    }

    public remove(key: string): void {
        delete AppSettings.strings[key];
        delete AppSettings.numbers[key];
    }
}
