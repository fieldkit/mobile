import { Connectivity as ConnectivityImpl } from "@nativescript/core";

type Callback = (newType: any) => void;

export const Connectivity = {
    startMonitoring: (callback: Callback) => {
        return ConnectivityImpl.startMonitoring(callback);
    },
    connectionType: ConnectivityImpl.connectionType,
    typeToString: (type) => {
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
