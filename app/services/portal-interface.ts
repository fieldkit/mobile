import _ from "lodash";
import axios from "axios";
import AppSettings from "../wrappers/app-settings";
import { Download, FileTypeUtils } from "../store/types";
import { AuthenticationError } from "../lib/errors";
import Config from "../config";
import * as ActionTypes from "../store/actions";

type ProgressFunc = (total: number, copied: number, info: object) => void;

export class ApiUnexpectedStatus extends Error {
    constructor(message) {
        super(message);
    }
}

export default class PortalInterface {
    _services: any;
    _dbInterface: any;
    _fs: any;
    _conservify: any;
    _currentUser: any;
    _appSettings: any;
    _store: any;

    constructor(services) {
        this._services = services;
        this._dbInterface = services.Database();
        this._fs = services.FileSystem();
        this._conservify = services.Conservify();
        this._currentUser = {};
        this._appSettings = new AppSettings();
        this._store = services.Store();
    }

    private getUri() {
        return this._dbInterface.getConfig().then((config) => {
            if (config.length == 0) {
                return Config.baseUri;
            } else {
                return config[0].baseUri;
            }
        });
    }

    private storeCurrentUser(refreshed, accessToken) {
        return this.query({
            refreshed: refreshed || false,
            authenticated: true,
            method: "GET",
            url: "/user",
        }).then((data) => {
            this._currentUser.name = data.name;
            this._currentUser.portalId = data.id;
            this._currentUser.email = data.email;
            this._currentUser.token = accessToken;
            this._store.dispatch(ActionTypes.UPDATE_ACCOUNT, { ...this._currentUser });

            return data;
        });
    }

    public isAvailable() {
        return this.getUri().then((baseUri) =>
            axios({ url: baseUri + "/status" })
                .then((r) => true)
                .catch((e) => false)
        );
    }

    public getCurrentUser() {
        return this._currentUser;
    }

    public isLoggedIn() {
        return this._appSettings.getString("accessToken") ? true : false;
    }

    public getCurrentToken() {
        return this._appSettings.getString("accessToken");
    }

    public login(user) {
        return this.getUri().then((baseUri) =>
            axios({
                method: "POST",
                url: baseUri + "/login",
                headers: { "Content-Type": "application/json" },
                data: user,
            })
                .then((response) => this.handleTokenResponse(response))
                .catch((error) => this.handleError(error))
        );
    }

    public logout() {
        this._appSettings.remove("accessToken");
        this._store.dispatch(ActionTypes.LOGOUT_ACCOUNTS);
        return Promise.resolve(true);
    }

    public register(user) {
        return this.query({
            method: "POST",
            url: "/users",
            data: user,
        }).then(() => {
            // TODO This should return the user object.
            return "Account created";
        });
    }

    resetPassword(email) {}

    public getTransmissionToken(): Promise<{ token: string; url: string }> {
        return this.query({
            method: "GET",
            authenticated: true,
            url: "/user/transmission-token",
        });
    }

    public addStation(data) {
        return this.query({
            authenticated: true,
            method: "POST",
            url: "/stations",
            data: data,
        });
    }

    public updateStation(data, portalId) {
        return this.query({
            authenticated: true,
            method: "PATCH",
            url: "/stations/" + portalId,
            data: data,
        });
    }

    public getStationSyncState(deviceId) {
        return this.query({
            authenticated: true,
            url: "/data/devices/" + deviceId + "/summary",
        });
    }

    public getStations() {
        return this.query({
            authenticated: true,
            url: "/stations",
        });
    }

    public getStationById(id) {
        return this.query({
            authenticated: true,
            url: "/stations/@/" + id,
        });
    }

    public addFieldNote(data) {
        return this.query({
            authenticated: true,
            method: "POST",
            url: "/stations/" + data.stationId + "/field-notes",
            data: data,
        });
    }

    public listFirmware(module) {
        return this.query({
            url: "/firmware" + (module ? "?module=" + module : ""),
        });
    }

    public onlyIfAuthenticated() {
        if (!this.isLoggedIn()) {
            return Promise.reject(new AuthenticationError("unauthenticated"));
        }
        return this.isAvailable().then((yes) => {
            if (!yes) {
                return Promise.reject(new AuthenticationError("unauthenticated"));
            }
            return true;
        });
    }

    public downloadFirmware(url, local, progress) {
        const headers = {
            Authorization: this._appSettings.getString("accessToken"),
        };
        return this.getUri().then((baseUri) =>
            this._services
                .Conservify()
                .download({
                    url: baseUri + url,
                    path: local,
                    headers: { ...headers },
                    progress: progress,
                })
                .then((e) => {
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

    public addFieldNoteMedia(data) {
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
            .then((e) => {
                // Our library uses statusCode, axios uses status
                return {
                    data: e.body,
                    status: e.statusCode,
                };
            });
    }

    private handleTokenResponse(response) {
        if (response.status !== 204) {
            throw new Error("authentication failed");
        }

        // Headers should always be lower case, bug otherwise.
        const accessToken = response.headers.authorization;
        this._appSettings.setString("accessToken", accessToken);
        return this.storeCurrentUser(true, accessToken).then(() => {
            return {
                token: accessToken,
            };
        });
    }

    private getHeaders(req) {
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

    private query(req) {
        return this.getHeaders(req).then((headers) => {
            return this.getUri().then((baseUri) => {
                console.log("portal query", req.method || "GET", baseUri + req.url);
                req.headers = headers;
                req.url = baseUri + req.url;
                return axios(req)
                    .then((response) => response.data)
                    .catch((error) => {
                        if (error.response.status === 401) {
                            return this.tryRefreshToken(req);
                        }

                        console.log(req.url, "portal error", error.response.status, error.response.data);
                        console.log(req.url, "portal error", req);

                        throw error;
                    });
            });
        });
    }

    private tryRefreshToken(original) {
        const token = this.parseToken(this._appSettings.getString("accessToken"));
        if (token == null) {
            return Promise.reject(new AuthenticationError("no token"));
        }

        if (original.refreshed === true) {
            console.log("refresh failed, clear token");
            return this.logout().then((_) => {
                return Promise.reject(new AuthenticationError("refresh token failed"));
            });
        }

        const requestBody = {
            refreshToken: token.refresh_token,
        };

        console.log("refreshing token", requestBody);

        return this.getUri().then((baseUri) =>
            axios({
                method: "POST",
                url: baseUri + "/refresh",
                data: requestBody,
            })
                .then((response) => {
                    return this.handleTokenResponse(response).then(() => {
                        return this.query(_.extend({ refreshed: true }, original));
                    });
                })
                .catch((error) => {
                    console.log("refresh failed", error);
                    return this.logout().then((_) => {
                        return Promise.reject(error);
                    });
                })
        );
    }

    private parseToken(token) {
        try {
            const encoded = token.split(".")[1];
            const decoded = Buffer.from(encoded, "base64").toString();
            return JSON.parse(decoded);
        } catch (e) {
            console.log("error parsing token", e, "token", token);
            return null;
        }
    }

    private handleError(error) {
        throw error;
    }

    private getIngestionUri() {
        return this._dbInterface.getConfig().then((config) => {
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
            return Promise.reject(new AuthenticationError("no token"));
        }

        const headers = {
            "Fk-Blocks": download.blocks,
            "Fk-Generation": download.generationId,
            "Fk-Type": FileTypeUtils.toString(download.fileType),
        };

        console.log("uploading", download.path, headers);

        /**
         * Alright let's talk about this. I've got old data in the
         * wild that is encountering this situation and this seems
         * like the no consequences way of just purging that
         * data. What can be more noop than uploading nothing?
         */
        const local = this._fs.getRelativeFile(download.path);
        if (!local.exists) {
            console.log(`missing file: ${local.path} faking success`);
            return Promise.resolve({
                statusCode: 200,
                headers: headers,
            });
        }
        if (!local.size) {
            console.log(`empty file: ${local.path} faking success`);
            return Promise.resolve({
                statusCode: 200,
                headers: headers,
            });
        }

        console.log("uploading", local.path, local.exists, local.size);

        const defaultHeaders = {
            "Content-Type": "application/octet-stream",
            Authorization: token,
            "Fk-DeviceId": download.deviceId,
            "Fk-DeviceName": deviceName,
        };

        console.log("uploading", { ...headers, ...defaultHeaders });

        delete headers["connection"];
        delete headers["content-length"];

        return this.getIngestionUri().then((url) =>
            this._conservify
                .upload({
                    method: "POST",
                    url: url,
                    path: local.path,
                    headers: { ...headers, ...defaultHeaders },
                    progress: progress,
                })
                .then((response) => {
                    if (response.statusCode != 200) {
                        return Promise.reject(new ApiUnexpectedStatus(`unexpected status: ${response.statusCode}`));
                    }
                    return response;
                })
        );
    }

    public getStationNotes(id: number): Promise<any> {
        return this.query({
            authenticated: true,
            url: "/stations/" + id + "/notes",
        });
    }

    public updateStationNotes(id: number, payload: any): Promise<any> {
        return this.query({
            method: "PATCH",
            authenticated: true,
            url: "/stations/" + id + "/notes",
            data: { notes: payload },
        });
    }

    public uploadStationMedia(stationId: number, key: string, contentType: string, path: string) {
        if (!key) throw new Error("key is undefined");
        const headers = {
            Authorization: this._appSettings.getString("accessToken"),
            "Content-Type": contentType,
        };
        return this.getUri().then((baseUri) => {
            const url = baseUri + "/stations/" + stationId + "/media?key=" + key;
            console.log("uploading:", url, baseUri, stationId, key);

            if (!url) {
                throw new Error("bad url");
            }
            if (!path) {
                throw new Error("bad path");
            }

            return this._services
                .Conservify()
                .upload({
                    url: url,
                    method: "POST",
                    path: path,
                    headers: { ...headers },
                    progress: (total, copied, info) => {
                        // Do nothing.
                    },
                })
                .then(
                    (response) => {
                        // Our library uses statusCode, axios uses status
                        return {
                            data: response.body,
                            status: response.statusCode,
                        };
                    },
                    (err) => Promise.reject(err)
                );
        });
    }

    public downloadStationMedia(mediaId: number, path: string) {
        const headers = {
            Authorization: this._appSettings.getString("accessToken"),
        };

        return this.getUri().then((baseUri) => {
            return this._services
                .Conservify()
                .download({
                    url: baseUri + "/notes/media/" + mediaId,
                    method: "GET",
                    path: path,
                    headers: { ...headers },
                    progress: (total, copied, info) => {
                        // Do nothing.
                    },
                })
                .then(
                    (response) => {
                        // Our library uses statusCode, axios uses status
                        return {
                            data: response.body,
                            status: response.statusCode,
                        };
                    },
                    (err) => Promise.reject(err)
                );
        });
    }
}
