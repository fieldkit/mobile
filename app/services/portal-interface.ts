import _ from "lodash";
import axios from "axios";
import AppSettings from "@/wrappers/app-settings";
import { AuthenticationError } from "@/lib/errors";
import { ActionTypes } from "@/store/actions";
import { Download, FileTypeUtils } from "@/store/types";
import { Services } from "@/services";

type ProgressFunc = (total: number, copied: number, info: object) => void;

export class ApiUnexpectedStatus extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class Ids {
    constructor(public readonly mobile: number, public readonly portal: number) {}
}

export interface QueryFields {
    method?: string;
    url: string;
    headers?: { [index: string]: string };
    refreshed?: boolean;
    authenticated?: boolean;
    data?: any;
}

export interface PortalStationNotes {
    id: number;
    createdAt: number;
    updatedAt: number;
    version: number;
    author: { id: number; name: number };
    key: string;
    body: string;
    media: { id: number; key: string; url: string; contentType: string }[];
}

export interface PortalNoteMedia {
    id: number;
    contentType: string;
    url: string;
    key: string;
}

export interface PortalStationNotesReply {
    media: PortalNoteMedia[];
    notes: PortalStationNotes[];
}

export class ExistingFieldNote {
    constructor(
        public readonly id: number,
        public readonly key: string,
        public readonly body: string,
        public readonly mediaIds: number[]
    ) {}
}

export class NewFieldNote {
    constructor(public readonly key: string, public readonly body: string, public readonly mediaIds: number[]) {}
}

export class PatchPortalNotes {
    constructor(public readonly creating: NewFieldNote[], public readonly notes: ExistingFieldNote[]) {}
}

export interface PortalPatchNotesPayload {
    notes: PatchPortalNotes[];
}
export interface CurrentUser {
    name: string;
    portalId: string;
    email: string;
    token: string;
    usedAt: Date | null;
}

export interface PortalStation {
    id: number;
    name: string;
    deviceId: string;
}

export interface PortalFirmware {
    id: number;
    time: number;
    url: string;
    meta: string | object;
    module: string;
    profile: string;
    etag: string;
    buildTime: number;
    buildNumber: string;
}

export interface AddStationFields {
    name: string;
    deviceId: string;
    locationName: string;
    statusPb: string;
}

export default class PortalInterface {
    private services: any;
    private fs: any;
    private conservify: any;
    private currentUser: CurrentUser | null = null;
    private appSettings: any;
    private store: any;

    constructor(services: Services) {
        this.fs = services.FileSystem();
        this.conservify = services.Conservify();
        this.appSettings = new AppSettings();
        this.store = services.Store();
    }

    private async getUri(): Promise<string> {
        return this.store.state.portal.env.baseUri;
    }

    private async getIngestionUri(): Promise<string> {
        return this.store.state.portal.env.ingestionUri;
    }

    public isAvailable(): Promise<boolean> {
        return this.getUri().then((baseUri) =>
            axios({ url: baseUri + "/status" })
                .then((r) => true)
                .catch((e) => false)
        );
    }

    public setCurrentUser(currentUser: CurrentUser): void {
        if (!currentUser) throw new Error(`invalid current user`);
        this.currentUser = currentUser;
        this.appSettings.setString("accessToken", currentUser.token);
    }

    public getCurrentUser(): CurrentUser | null {
        return this.currentUser;
    }

    public whoAmI(): Promise<CurrentUser> {
        return this.query({
            authenticated: true,
            url: "/user",
        }).then((user) => {
            const token = this.getCurrentToken();
            if (!token) {
                throw new Error(`no token after authentication`);
            }
            return {
                name: user.name,
                portalId: user.id,
                email: user.email,
                token: token,
                usedAt: new Date(),
            };
        });
    }

    public isLoggedIn(): boolean {
        return this.appSettings.getString("accessToken") ? true : false;
    }

    public getCurrentToken(): string | null {
        return this.appSettings.getString("accessToken");
    }

    public login(user: { email: string; password: string }): Promise<{ token: string }> {
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

    public logout(): Promise<boolean> {
        this.appSettings.remove("accessToken");
        this.store.dispatch(ActionTypes.LOGOUT_ACCOUNTS);
        return Promise.resolve(true);
    }

    // TODO Return token?
    public register(user: {}): Promise<void> {
        return this.query({
            method: "POST",
            url: "/users",
            data: user,
        });
    }

    public getTransmissionToken(): Promise<{ token: string; url: string }> {
        return this.query({
            method: "GET",
            authenticated: true,
            url: "/user/transmission-token",
        });
    }

    public addStation(data: AddStationFields): Promise<PortalStation> {
        return this.query({
            authenticated: true,
            method: "POST",
            url: "/stations",
            data: data,
        });
    }

    public updateStation(data: AddStationFields, portalId: number): Promise<PortalStation> {
        return this.query({
            authenticated: true,
            method: "PATCH",
            url: "/stations/" + portalId,
            data: data,
        });
    }

    public getStations(): Promise<{ stations: PortalStation[] }> {
        return this.query({
            authenticated: true,
            url: "/stations",
        });
    }

    public getStationById(id: number): Promise<PortalStation> {
        return this.query({
            authenticated: true,
            url: "/stations/@/" + id,
        });
    }

    public listFirmware(moduleName: string): Promise<{ firmwares: PortalFirmware[] }> {
        return this.query({
            url: "/firmware?module=" + moduleName,
        });
    }

    public onlyIfAuthenticated(): Promise<boolean> {
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

    public downloadFirmware(url: string, local: string, progress: ProgressFunc): Promise<{ data?: any; status: number }> {
        const headers = {
            Authorization: this.appSettings.getString("accessToken"),
        };
        return this.getUri().then((baseUri) =>
            this.conservify
                .download({
                    url: baseUri + url,
                    path: local,
                    headers: { ...headers },
                    progress: progress,
                })
                .then((e) => {
                    // Our library uses statusCode, axios uses status
                    if (e.statusCode != 200) {
                        return this.services
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

    private handleTokenResponse(response): Promise<{ token: string }> {
        if (response.status !== 204) {
            throw new Error("authentication failed");
        }

        // Headers should always be lower case, bug otherwise.
        const accessToken = response.headers.authorization;
        this.appSettings.setString("accessToken", accessToken);
        return Promise.resolve({
            token: accessToken,
        });
    }

    private getHeaders(req): Promise<any> {
        const token = this.appSettings.getString("accessToken");
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

    private query(req: QueryFields): Promise<any> {
        return this.getHeaders(req).then((headers) => {
            return this.getUri().then((baseUri) => {
                console.log("portal query", req.method || "GET", baseUri + req.url);
                req.headers = headers;
                req.url = baseUri + req.url;
                return axios(req as any)
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

    private tryRefreshToken(original: QueryFields): Promise<any> {
        const token = this.parseToken(this.appSettings.getString("accessToken"));
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

        console.log("refreshing token");

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
                .catch((error: Error) => {
                    console.log("refresh failed", error);
                    return this.logout().then((_) => {
                        return Promise.reject(error);
                    });
                })
        );
    }

    private parseToken(token: string): { refresh_token: string } | null {
        try {
            const encoded = token.split(".")[1];
            const decoded = Buffer.from(encoded, "base64").toString();
            return JSON.parse(decoded);
        } catch (e) {
            console.log("error parsing token", e, "token", token);
            return null;
        }
    }

    private handleError(error: Error): never {
        console.log(`portal-error: ${error}`);
        throw error;
    }

    public uploadPreviouslyDownloaded(
        deviceName: string,
        download: Download,
        progress: ProgressFunc
    ): Promise<{ statusCode: number; headers: { [index: string]: string } }> {
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
        const local = this.fs.getRelativeFile(download.path);
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
            this.conservify
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

    public getStationNotes(id: number): Promise<PortalStationNotesReply> {
        return this.query({
            authenticated: true,
            url: "/stations/" + id + "/notes",
        });
    }

    public updateStationNotes(id: number, payload: PatchPortalNotes): Promise<PortalStationNotes> {
        return this.query({
            method: "PATCH",
            authenticated: true,
            url: "/stations/" + id + "/notes",
            data: { notes: payload },
        });
    }

    public uploadStationMedia(stationId: number, key: string, contentType: string, path: string): Promise<{ data: any; status: number }> {
        if (!key) throw new Error("key is undefined");
        const headers = {
            Authorization: this.appSettings.getString("accessToken"),
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

            return this.conservify
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

    public downloadStationMedia(mediaId: number, path: string): Promise<{ data: any; status: number }> {
        const headers = {
            Authorization: this.appSettings.getString("accessToken"),
        };

        return this.getUri().then((baseUri) => {
            return this.conservify
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
