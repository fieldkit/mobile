import _ from "lodash";
import axios from "axios";
import AppSettings from "../wrappers/app-settings";
import { Download, FileTypeUtils } from "../store/types";
import { AuthenticationError } from "../lib/errors";
import Config from "../config";

type ProgressFunc = (total: number, copied: number, info: object) => void;

export default class PortalInterface {
    _services: any;
    _dbInterface: any;
    _fs: any;
    _conservify: any;
    _currentUser: any;
    _appSettings: any;

    constructor(services) {
        this._services = services;
        this._dbInterface = services.Database();
        this._fs = services.FileSystem();
        this._conservify = services.Conservify();
        this._currentUser = {};
        this._appSettings = new AppSettings();
    }

    getUri() {
        return this._dbInterface.getConfig().then(config => {
            if (config.length == 0) {
                return Config.baseUri;
            } else {
                return config[0].baseUri;
            }
        });
    }

    storeCurrentUser(refreshed) {
        return this._query({
            refreshed: refreshed || false,
            authenticated: true,
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
                .then(response => this._handleTokenResponse(response))
                .catch(error => this._handleError(error))
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
            authenticated: true,
            url: "/user/transmission-token",
        });
    }

    addStation(data) {
        return this._query({
            authenticated: true,
            method: "POST",
            url: "/stations",
            data: data,
        });
    }

    updateStation(data, portalId) {
        return this._query({
            authenticated: true,
            method: "PATCH",
            url: "/stations/" + portalId,
            data: data,
        });
    }

    getStationSyncState(deviceId) {
        return this._query({
            authenticated: true,
            url: "/data/devices/" + deviceId + "/summary",
        });
    }

    getStations() {
        return this._query({
            authenticated: true,
            url: "/stations",
        });
    }

    getStationById(id) {
        return this._query({
            authenticated: true,
            url: "/stations/@/" + id,
        });
    }

    addFieldNote(data) {
        return this._query({
            authenticated: true,
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
            return Promise.reject(new AuthenticationError("unauthenticated"));
        }
        return this.isAvailable().then(yes => {
            if (!yes) {
                return Promise.reject(new AuthenticationError("unauthenticated"));
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

    _handleTokenResponse(response) {
        if (response.status !== 204) {
            throw new Error("authentication failed");
        }

        // Headers should always be lower case, bug otherwise.
        const accessToken = response.headers.authorization;
        this._appSettings.setString("accessToken", accessToken);
        return this.storeCurrentUser(true).then(() => {
            return {
                token: accessToken,
            };
        });
    }

    _getHeaders(req) {
        const token = this._appSettings.getString("accessToken");
        if (token && token.length > 0) {
            return Promise.resolve(
                _.merge(req.headers || {}, {
                    "Content-Type": "application/json",
                    Authorization: token,
                })
            );
        }

        if (req.authenticated) {
            console.log("skipping portal query, no auth");
            return Promise.reject(new AuthenticationError("no token, skipping query"));
        }

        return Promise.resolve(req.headers);
    }

    _query(req) {
        console.log("portal query", req.method || "GET", req.url);
        return this._getHeaders(req).then(headers => {
            return this.getUri().then(baseUri => {
                req.headers = headers;
                req.url = baseUri + req.url;
                return axios(req)
                    .then(response => response.data)
                    .catch(error => {
                        if (error.response.status === 401) {
                            return this._tryRefreshToken(req);
                        }

                        console.log(req.url, "portal error", error.response.status, error.response.data);
                        console.log(req.url, "portal error", req);

                        throw error;
                    });
            });
        });
    }

    _tryRefreshToken(original) {
        const token = this._parseToken(this._appSettings.getString("accessToken"));
        if (token == null) {
            return Promise.reject(new AuthenticationError("no token"));
        }

        if (original.refreshed === true) {
            console.log("refresh failed, clear token");
            return this.logout().then(_ => {
                return Promise.reject(new AuthenticationError("refresh token failed"));
            });
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
                        return this._query(_.extend({ refreshed: true }, original));
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

    private getIngestionUri() {
        return this._dbInterface.getConfig().then(config => {
            if (config.length == 0) {
                return Config.ingestionUri;
            } else {
                return config[0].ingestionUri;
            }
        });
    }

    public uploadPreviouslyDownloaded(deviceName: string, download: Download, progress: ProgressFunc) {
        const token = this.getCurrentToken();
        if (!token) {
            return Promise.reject(new Error("no token"));
        }

        const headers = {
            "Fk-Blocks": download.blocks,
            "Fk-Generation": download.generationId,
            "Fk-Type": FileTypeUtils.toString(download.fileType),
        };

        console.log("uploading", download.path, headers);

        const local = this._fs.getFile(download.path);
        if (!local.exists) {
            return Promise.reject(new Error(`missing file: ${download.path}`));
        }
        if (!local.size) {
            return Promise.reject(new Error(`empty file: ${download.path}`));
        }

        console.log("uploading", download.path, local.exists, local.size);

        const defaultHeaders = {
            "Content-Type": "application/octet-stream",
            Authorization: token,
            "Fk-DeviceId": download.deviceId,
            "Fk-DeviceName": deviceName,
        };

        console.log("uploading", { ...headers, ...defaultHeaders });

        delete headers["connection"];
        delete headers["content-length"];

        return this.getIngestionUri().then(url =>
            this._conservify
                .upload({
                    method: "POST",
                    url: url,
                    path: download.path,
                    headers: { ...headers, ...defaultHeaders },
                    progress: progress,
                })
                .then(response => {
                    if (response.statusCode != 200) {
                        return Promise.reject(response);
                    }
                    return response;
                })
        );
    }
}
