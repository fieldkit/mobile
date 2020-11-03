import { Connectivity as ConnectivityImpl } from "@nativescript/core";

type Callback = (newType: number) => void;

export const Connectivity = {
    startMonitoring: (callback: Callback): void => {
        return ConnectivityImpl.startMonitoring(callback);
    },
    connectionType: ConnectivityImpl.connectionType,
    typeToString: (type: number): string => {
        switch (type) {
            case ConnectivityImpl.connectionType.wifi:
                return "wifi";
            case ConnectivityImpl.connectionType.none:
                return "none";
            case ConnectivityImpl.connectionType.mobile:
                return "mobile";
            case ConnectivityImpl.connectionType.ethernet:
                return "ethernet";
            case ConnectivityImpl.connectionType.bluetooth:
                return "bluetooth";
        }
        return "unknown";
    },
};
