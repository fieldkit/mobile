import _ from "lodash";
import axios from "axios";
import Config from "../config";
import AppSettings from "../wrappers/app-settings";

export default class PortalInterface {
    constructor(services) {
        this._services = services;
        this._dbInterface = services.Database();

        this._handleTokenResponse = this._handleTokenResponse.bind(this);
        this._handleStandardResponse = this._handleStandardResponse.bind(this);
        this._handleError = this._handleError.bind(this);
        this._currentUser = {};
        this._appSettings = new AppSettings();
    }

    getUri() {
        return this._dbInterface.getConfig().then(config => {
            if (config.length == 0) {
                console.log("PortalInterface did not get config from db. Using config.js", Config.baseUri);
                return Config.baseUri;
            } else {
                return config[0].baseUri;
            }
        });
    }

    storeCurrentUser() {
        return this._query({
            method: "GET",
            url: "/user",
        }).then(data => {
            this._currentUser.name = data.name;
            this._currentUser.portalId = data.id;
            return data;
        });
    }

    isAvailable() {
        return this.getUri().then(baseUri =>
            axios({ url: baseUri + "/status" })
                .then(r => true)
                .catch(e => false)
        );
    }

    getCurrentUser() {
        return this._currentUser;
    }

    isLoggedIn() {
        return this._appSettings.getString("accessToken") ? true : false;
    }

    getCurrentToken() {
        return this._appSettings.getString("accessToken");
    }

    login(user) {
        return this.getUri().then(baseUri =>
            axios({
                method: "POST",
                url: baseUri + "/login",
                headers: { "Content-Type": "application/json" },
                data: user,
            })
                .then(this._handleTokenResponse)
                .catch(this._handleError)
        );
    }

    logout() {
        this._appSettings.remove("accessToken");
        return Promise.resolve(true);
    }

    register(user) {
        return this._query({
            method: "POST",
            url: "/users",
            data: user,
        }).then(() => {
            // TODO This should return the user object.
            return "Account created";
        });
    }

    resetPassword(email) {}

    getTransmissionToken() {
        return this._query({
            url: "/user/transmission-token",
        });
    }

    addStation(data) {
        return this._query({
            method: "POST",
            url: "/stations",
            data: data,
        });
    }

    updateStation(data, portalId) {
        return this._query({
            method: "PATCH",
            url: "/stations/" + portalId,
            data: data,
        });
    }

    getStationSyncState(deviceId) {
        return this._query({
            url: "/data/devices/" + deviceId + "/summary",
        });
    }

    getStations() {
        return this._query({
            url: "/stations",
        });
    }

    getStationById(id) {
        return this._query({
            url: "/stations/@/" + id,
        });
    }

    addFieldNote(data) {
        return this._query({
            method: "POST",
            url: "/stations/" + data.stationId + "/field-notes",
            data: data,
        });
    }

    listFirmware(module) {
        return this._query({
            url: "/firmware" + (module ? "?module=" + module : ""),
        });
    }

    onlyIfAuthenticated() {
        if (!this.isLoggedIn()) {
            return Promise.reject(false);
        }
        return this.isAvailable().then(yes => {
            if (!yes) {
                return Promise.reject(false);
            }
            return true;
        });
    }

    downloadFirmware(url, local, progress) {
        const headers = {
            Authorization: this._appSettings.getString("accessToken"),
        };
        return this.getUri().then(baseUri =>
            this._services
                .Conservify()
                .download({
                    url: baseUri + url,
                    path: local,
                    headers: { ...headers },
                    progress: progress,
                })
                .then(e => {
                    // Our library uses statusCode, axios uses status
                    if (e.statusCode != 200) {
                        return this._services
                            .FileSystem()
                            .getFile(local)
                            .remove()
                            .then(() => {
                                return Promise.reject(new Error("download failed: " + e.body));
                            });
                    }
                    return {
                        data: e.body,
                        status: e.statusCode,
                    };
                })
        );
    }

    addFieldNoteMedia(data) {
        const headers = {
            Authorization: this._appSettings.getString("accessToken"),
        };
        return this._services
            .Conservify()
            .upload({
                url: "/stations/" + data.stationId + "/field-note-media",
                method: "POST",
                path: data.pathDest,
                headers: { ...headers },
                progress: (total, copied, info) => {
                    // Do nothing.
                },
            })
            .then(e => {
                // Our library uses statusCode, axios uses status
                return {
                    data: e.body,
                    status: e.statusCode,
                };
            });
    }

    _handleStandardResponse(response) {
        if (response.status === 200) {
            return response.data;
        }

        if (response.status === 204) {
            return {};
        }

        throw new Error("Query failed");
    }

    _handleTokenResponse(response) {
        if (response.status !== 204) {
            throw new Error("authentication failed");
        }

        // Headers should always be lower case, bug otherwise.
        const accessToken = response.headers.authorization;
        this._appSettings.setString("accessToken", accessToken);
        return this.storeCurrentUser().then(() => {
            return {
                token: accessToken,
            };
        });
    }

    _getHeaders(req) {
        const token = this._appSettings.getString("accessToken");
        if (token) {
            return _.merge(req.headers || {}, {
                "Content-Type": "application/json",
                Authorization: this._appSettings.getString("accessToken"),
            });
        }
        return req.headers;
    }

    _query(req) {
        console.log("portal query", req.method || "GET", req.url);
        req.headers = this._getHeaders(req);
        return this.getUri().then(baseUri => {
            req.url = baseUri + req.url;
            return axios(req)
                .then(response => response.data)
                .catch(error => {
                    if (error.response.status === 401) {
                        return this._tryRefreshToken(req);
                    }

                    console.log("portal error", error.response.status, error.response.data);

                    throw error;
                });
        });
    }

    _tryRefreshToken(original) {
        const token = this._parseToken(this._appSettings.getString("accessToken"));
        if (token == null) {
            return Promise.reject("no token");
        }

        const requestBody = {
            refresh_token: token.refresh_token,
        };

        console.log("refreshing token", requestBody);

        return this.getUri().then(baseUri =>
            axios({
                method: "POST",
                url: baseUri + "/refresh",
                data: requestBody,
            })
                .then(response => {
                    return this._handleTokenResponse(response).then(() => {
                        return this._query(original);
                    });
                })
                .catch(error => {
                    console.log("refresh failed", error);
                    return this.logout().then(_ => {
                        return Promise.reject(error);
                    });
                })
        );
    }

    _parseToken(token) {
        try {
            const encoded = token.split(".")[1];
            const decoded = Buffer.from(encoded, "base64").toString();
            return JSON.parse(decoded);
        } catch (e) {
            console.log("error parsing token", e, "token", token);
            return null;
        }
    }

    _handleError(error) {
        throw error;
    }
}
