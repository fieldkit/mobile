export interface LocalConfig {
    dev: boolean;
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
