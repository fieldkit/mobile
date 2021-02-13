export interface LocalConfig {
    dev: boolean;
    beta: boolean;
    emulator: boolean;
    debugging: {
        machine: string | null;
    };
    vue: { verbose: boolean };
    baseUri: string;
    ingestionUri: string;
    db: {
        drop: boolean;
    };
    lossBufferDelay: number;
    defaultStations: {
        address: string;
        port: number;
    }[];
    defaultUsers: {
        email: string;
        password: string;
    }[];
    defaultNetworks: {
        ssid: string;
        password: string;
    }[];
    mapbox: {
        token: string;
        style: string;
    };
}
