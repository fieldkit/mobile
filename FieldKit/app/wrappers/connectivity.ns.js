import * as ConnectivityModule from "tns-core-modules/connectivity";

export const Connectivity = {
    startMonitoring: callback => {
        return ConnectivityModule.startMonitoring(callback);
    },
};
