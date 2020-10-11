declare module "tns-core-modules/application-settings" {
    class Settings {
        static getString(key: string): string;
        static getNumber(key: string): number;
        static setString(key: string, value: string): void;
        static setNumber(key: string, value: number): void;
        static remove(key: string): void;
    }
    export = Settings;
}
