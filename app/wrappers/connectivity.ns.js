import * as ConnectivityModule from "tns-core-modules/connectivity";

export const Connectivity = {
    connectionType: ConnectivityModule.connectionType,
    startMonitoring: (callback) => {
        return ConnectivityModule.startMonitoring(callback);
    },
    typeToString: (type) => {
        switch (type) {
            case ConnectivityModule.connectionType.wifi:
                return "wifi";
            case ConnectivityModule.connectionType.none:
                return "none";
            case ConnectivityModule.connectionType.mobile:
                return "mobile";
            case ConnectivityModule.connectionType.ethernet:
                return "ethernet";
            case ConnectivityModule.connectionType.bluetooth:
                return "bluetooth";
        }
        return "unknown";
    },
};
