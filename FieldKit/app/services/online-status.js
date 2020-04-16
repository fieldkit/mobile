import Promise from "bluebird";
import * as ConnectivityModule from "tns-core-modules/connectivity";
import { promiseAfter } from "../utilities";
import axios from "axios";

export default class OnlineStatus {
    constructor(services) {
        this._services = services;
        this._online = false;
        this._url = "https://api.fieldkit.org/status";

        ConnectivityModule.startMonitoring(newType => {
            try {
                switch (newType) {
                    case ConnectivityModule.connectionType.none:
                        log.info("OnlineStatus: None");
                        break;
                    case ConnectivityModule.connectionType.wifi:
                        log.info("OnlineStatus: WiFi");
                        break;
                    case ConnectivityModule.connectionType.mobile:
                        log.info("OnlineStatus: Mobile");
                        break;
                    case ConnectivityModule.connectionType.ethernet:
                        log.info("OnlineStatus: Ethernet");
                        break;
                    case ConnectivityModule.connectionType.bluetooth:
                        log.info("OnlineStatus: Bluetooth");
                        break;
                    default:
                        break;
                }

                this._try();
            } catch (e) {
                console.log("error", e);
            }
        });
    }

    _try() {
        console.log("OnlineStatus: checking");

        return axios({ url: this._url })
            .then(r => {
                if (this._online != true) {
                    console.log("OnlineStatus: online");
                    this._online = true;
                }
                return Promise.resolve(this._online);
            })
            .catch(e => {
                if (this._online != false) {
                    console.log("OnlineStatus: offline");
                    this._online = false;
                }
                return Promise.resolve(this._online);
            });
    }

    /**
     * Only resolves if the user is online, otherwise the operation never happens.
     */
    ifOnline() {
        return new Promise((resolve, reject) => {
            if (this._online) {
                resolve(true);
            }
        });
    }

    /**
     * Resolves a value that indiciates if the user is online.
     */
    isOnline() {
        return new Promise((resolve, reject) => {
            resolve(this._online);
        });
    }

    start() {
        this._try();
    }
}
