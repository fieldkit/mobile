import _ from "lodash";
import axios, { AxiosResponse, AxiosError } from "axios";
import { HttpResponse } from "@/wrappers/networking";
import { debug, AuthenticationError } from "@/lib";
import { ActionTypes, MutationTypes, Download, FileTypeUtils, CurrentUser } from "@/store";
import { Services, Conservify, FileSystem, OurStore } from "@/services";
import { Buffer } from "buffer";
import Config from "@/config";

type ProgressFunc = (total: number, copied: number, info: never) => void;

export { AxiosResponse, AxiosError };

export class ApiUnexpectedStatus extends Error {
    constructor(message: string) {
        super(message);
    }
}

export class Ids {
    constructor(public readonly mobile: number, public readonly portal: number) {}
}

export interface QueryFields<T> {
    method?: string;
    url: string;
    headers?: { [index: string]: string };
    refreshed?: boolean;
    authenticated?: boolean;
    token?: string;
    connectTimeout?: number;
    data?: T;
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

export interface PortalStation {
    id: number;
    name: string;
    deviceId: string;
    owner: {
        id: number;
    };
}

export interface PortalFirmware {
    id: number;
    time: number;
    url: string;
    meta: Record<string, unknown>;
    module: string;
    profile: string;
    etag: string;
    buildTime: number;
    buildNumber: string;
    logicalAddress?: number;
}

export interface AddStationFields {
    name: string;
    deviceId: string;
    locationName: string;
    statusPb: string;
}

export interface AddUserFields {
    name: string;
    email: string;
    password: string;
    tncAccept: boolean;
}

export interface PortalCurrentUser {
    name: string;
    id: number;
    email: string;
    tncDate: number;
}

export default class PortalInterface {
    private fs: FileSystem;
    private conservify: Conservify;
    private store: OurStore;

    constructor(public readonly services: Services) {
        this.fs = services.FileSystem();
        this.conservify = services.Conservify();
        this.store = services.Store();
    }

    private get currentUser(): CurrentUser | null {
        return this.store.state.portal.currentUser;
    }

    private getUri(): Promise<string> {
        return Promise.resolve(this.store.state.portal.env.baseUri);
    }

    private getIngestionUri(): Promise<string> {
        return Promise.resolve(this.store.state.portal.env.ingestionUri);
    }

    private getCurrentToken(): string | null {
        if (this.isTncValid()) {
            return this.currentUser?.token ?? null;
        } else {
            debug.log("portal query: tnc invalid");
        }
        return null;
    }

    public isLoggedIn(): boolean {
        return this.currentUser != null;
    }

    public isTncValid(): boolean {
        debug.log("portal query: tnc valid", this.currentUser?.tncDate);
        if (this.currentUser != null && this.currentUser.tncDate != null) {
            return this.currentUser.tncDate >= Config.tncDate;
        }

        return true;
    }

    private requireToken(): string {
        const token = this.getCurrentToken();
        if (!token) throw new AuthenticationError(`unauthenticated`);
        return token;
    }

    public async isAvailable(): Promise<boolean> {
        const baseUri = await this.getUri();

        debug.log(`portal query`, "GET", baseUri + "/status");
        return axios
            .request({ url: baseUri + "/status" })
            .then(() => {
                return true;
            })
            .catch(() => {
                debug.log(`portal unavailable`);
                return false;
            });
    }

    private async whoAmI(token: string): Promise<CurrentUser> {
        const user = await this.query<never, PortalCurrentUser>({
            authenticated: true,
            token: token,
            url: "/user",
        });

        debug.log(`portal-interface:whoAmI: ${JSON.stringify(user)}`);
        if (!user || !user.id) throw new Error(`no authenticated user`);

        const transmission = await this.query<never, { token: string; url: string }>({
            method: "GET",
            authenticated: true,
            token: token,
            url: "/user/transmission-token",
        });

        return {
            name: user.name,
            portalId: user.id,
            email: user.email,
            token: token,
            transmission: transmission,
            usedAt: new Date(),
            lastSync: null,
            tncDate: user.tncDate,
        };
    }

    public async login(user: { email: string; password: string }): Promise<CurrentUser> {
        const baseUri = await this.getUri();
        debug.log(`portal query`, "POST", baseUri + "/login");
        return await axios
            .request({
                method: "POST",
                url: baseUri + "/login",
                headers: { "Content-Type": "application/json" },
                data: user,
            })
            .catch((error) => this.handleError(error))
            .then((response) => {
                return this.handleTokenResponse(response);
            });
    }

    public async logout(): Promise<void> {
        await this.store.dispatch(ActionTypes.LOGOUT_ACCOUNTS);
    }

    public async forgotPassword(payload: { email: string }): Promise<void> {
        const baseUri = await this.getUri();
        debug.log(`portal query`, "POST", baseUri + "/user/recovery/lookup");
        await axios
            .request({
                method: "POST",
                url: baseUri + "/user/recovery/lookup",
                headers: { "Content-Type": "application/json" },
                data: payload,
            })
            .catch((error) => this.handleError(error));
    }

    public async register(user: AddUserFields): Promise<void> {
        await this.query({
            method: "POST",
            url: "/users",
            data: {
                name: user.name,
                email: user.email,
                password: user.password,
                tncAccept: user.tncAccept,
            },
        });
    }

    public async accept(user: CurrentUser): Promise<void> {
        if (!user.token) throw new Error(`no token for account`);

        let betaSkip404Errors = false;

        await this.query({
            authenticated: true,
            token: user.token,
            method: "PATCH",
            url: `/users/${user.portalId}/accept-tnc`,
            data: {
                accept: true,
            },
        }).catch((error: AxiosError) => {
            // temp fix until prod deploy
            if (Config.beta && error.response?.status === 404) {
                betaSkip404Errors = true;
            }
        });

        const self = await this.whoAmI(user.token);

        if (betaSkip404Errors) {
            self.tncDate = Config.tncDate;
        }

        this.store.commit(MutationTypes.SET_CURRENT_USER, self);
    }

    public async addStation(user: CurrentUser, data: AddStationFields): Promise<PortalStation> {
        if (!user.token) throw new Error(`no token for account`);
        return await this.query({
            authenticated: true,
            token: user.token,
            method: "POST",
            url: "/stations",
            data: data,
        }).then((data) => {
            return data as PortalStation;
        });
    }

    public async updateStation(data: AddStationFields, portalId: number): Promise<PortalStation> {
        return await this.query({
            authenticated: true,
            method: "PATCH",
            url: `/stations/${portalId}`,
            data: data,
        }).then((data) => {
            return data as PortalStation;
        });
    }

    public async listFirmware(moduleName: string): Promise<{ firmwares: PortalFirmware[] }> {
        return await this.query({
            url: `/firmware?module=${moduleName}`,
        }).then((data) => {
            return data as { firmwares: PortalFirmware[] };
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

    private getDownloadHeaders(): { [index: string]: string } {
        const token = this.getCurrentToken();
        if (token) {
            return {
                Authorization: token,
            };
        }
        return {};
    }

    public async downloadFirmware(url: string, path: string, progress: ProgressFunc): Promise<{ status: number }> {
        const headers = this.getDownloadHeaders();

        const baseUri = await this.getUri();

        const local = this.fs.getRelativeFile(path);

        return this.conservify
            .download({
                url: baseUri + url,
                path: local.path,
                headers: { ...headers },
                progress: progress,
            })
            .then((e) => {
                // Our library uses statusCode, axios uses status
                if (e.statusCode != 200) {
                    return this.services
                        .FileSystem()
                        .getFile(local.path)
                        .remove()
                        .then(() => {
                            return Promise.reject(new Error(`download failed: ${JSON.stringify(e.body)}`));
                        });
                }
                return {
                    // data: e.body,
                    status: e.statusCode,
                };
            });
    }

    public async uploadPreviouslyDownloaded(
        stationId: number,
        deviceName: string,
        download: Download,
        progress: ProgressFunc
    ): Promise<{ statusCode: number; headers: { [index: string]: string } }> {
        const defaultUser = this.store.state.portal.currentUser;
        const usersById = this.store.getters.usersById;
        const station = this.store.getters.stationsById[stationId];
        if (!station) return Promise.reject(new Error(`no such station: ${stationId}`));
        const user = (station.userId ? usersById[station.userId] : null) ?? defaultUser;
        if (!user) return Promise.reject(new AuthenticationError("no user"));

        const headers = {
            "Fk-Blocks": download.blocks,
            "Fk-Generation": download.generationId,
            "Fk-Type": FileTypeUtils.toString(download.fileType),
        };

        debug.log("uploading", download.path, headers);

        /**
         * Alright let's talk about this. I've got old data in the
         * wild that is encountering this situation and this seems
         * like the no consequences way of just purging that
         * data. What can be more noop than uploading nothing?
         */
        const local = this.fs.getRelativeFile(download.path);
        if (!local.exists) {
            debug.log(`missing file: ${local.path} faking success`);
            return Promise.resolve({
                statusCode: 200,
                headers: headers,
            });
        }
        if (!local.size) {
            debug.log(`empty file: ${local.path} faking success`);
            return Promise.resolve({
                statusCode: 200,
                headers: headers,
            });
        }

        debug.log("uploading", local.path, local.exists, local.size);

        if (!user.token) throw new Error(`no token for account`);

        const defaultHeaders = {
            "Content-Type": "application/octet-stream",
            Authorization: user.token,
            "Fk-DeviceId": download.deviceId,
            "Fk-DeviceName": deviceName,
        };

        debug.log("uploading", { ...headers, ...defaultHeaders });

        delete headers["connection"];
        delete headers["content-length"];

        const url = await this.getIngestionUri();

        return this.conservify
            .upload({
                method: "POST",
                url: url,
                path: local.path,
                headers: { ...headers, ...defaultHeaders },
                progress: progress,
            })
            .then((response) => {
                if (response.statusCode == 401) {
                    debug.log(`invalid authentication: ${response.statusCode}`);
                    return Promise.reject(new AuthenticationError(`invalid authentication: ${response.statusCode}`));
                }
                if (response.statusCode != 200) {
                    debug.log(`unexpected status: ${response.statusCode}`);
                    return Promise.reject(new ApiUnexpectedStatus(`unexpected status: ${response.statusCode}`));
                }
                return response;
            });
    }

    public async getStationNotes(stationId: number): Promise<PortalStationNotesReply> {
        return await this.query({
            authenticated: true,
            url: `/stations/${stationId}/notes`,
        }).then((data) => {
            return data as PortalStationNotesReply;
        });
    }

    public async updateStationNotes(stationId: number, payload: PatchPortalNotes): Promise<PortalStationNotes> {
        return await this.query({
            method: "PATCH",
            authenticated: true,
            url: `/stations/${stationId}/notes`,
            data: { notes: payload },
        }).then((data) => {
            return data as PortalStationNotes;
        });
    }

    public async uploadStationMedia(
        stationId: number,
        key: string,
        contentType: string,
        path: string
    ): Promise<{ data: { id: number }; status: number }> {
        if (!key) throw new Error(`key is undefined`);

        const headers = {
            Authorization: this.requireToken(),
            "Content-Type": contentType,
        };
        const baseUri = await this.getUri();
        const url = `${baseUri}/stations/${stationId}/media?key=${key}`;
        debug.log("uploading:", url, baseUri, stationId, key);

        if (!url) throw new Error("bad url");
        if (!path) throw new Error("bad path");

        return this.conservify
            .upload({
                url: url,
                method: "POST",
                path: path,
                headers: { ...headers },
                progress: (/*total: number, copied: number, info: never*/) => {
                    // Do nothing.
                },
            })
            .then(
                (response: HttpResponse) => {
                    debug.log("station-media-upload:", response.body);
                    let data: unknown = response.body;
                    if (response.body instanceof Buffer) {
                        data = JSON.parse(response.body.toString());
                    }
                    return {
                        data: data as { id: number },
                        status: response.statusCode,
                    };
                },
                (err) => Promise.reject(err)
            );
    }

    public async downloadStationMedia(mediaId: number, path: string): Promise<{ data: Buffer; status: number }> {
        const headers = {
            Authorization: this.requireToken(),
        };

        const baseUri = await this.getUri();

        return this.conservify
            .download({
                url: `${baseUri}/notes/media/${mediaId}`,
                method: "GET",
                path: path,
                headers: { ...headers },
                progress: (/*total: number, copied: number, info: never*/) => {
                    // Do nothing.
                },
            })
            .then(
                (response: HttpResponse) => {
                    // Our library uses statusCode, axios uses status
                    return {
                        data: response.body,
                        status: response.statusCode,
                    };
                },
                (err) => Promise.reject(err)
            );
    }

    private async handleTokenResponse<V>(response: AxiosResponse<V>): Promise<CurrentUser> {
        if (response.status !== 204) {
            throw new Error("authentication failed");
        }

        // Headers should always be lower case, bug otherwise.
        const accessToken = response.headers["authorization"] as string; // eslint-disable-line
        const self = await this.whoAmI(accessToken);

        this.store.commit(MutationTypes.SET_CURRENT_USER, self);

        return self;
    }

    private getHeaders<T>(req: QueryFields<T>): Promise<Record<string, string>> {
        const token = req.token ?? this.getCurrentToken();
        if (token && token.length > 0) {
            return Promise.resolve(
                _.merge(req.headers || {}, {
                    "Content-Type": "application/json",
                    Authorization: token,
                })
            );
        }

        if (req.authenticated) {
            debug.log("skipping portal query, no auth");
            return Promise.reject(new AuthenticationError("no token, skipping query"));
        }

        if (!req.headers) {
            return Promise.resolve({});
        }

        return Promise.resolve(req.headers);
    }

    private async query<Q, V>(req: QueryFields<Q>): Promise<V> {
        const headers = await this.getHeaders<Q>(req);
        const baseUri = await this.getUri();

        debug.log(`portal query`, req.method || "GET", baseUri + req.url);

        const absoluteUrlAndHeaders = {
            headers: headers,
            url: baseUri + req.url,
        };

        // eslint-disable-next-line
        const axiosRequest = _.extend({}, req as any, absoluteUrlAndHeaders, { timeout: 1000, connectTimeout: 3000 });

        let id: ReturnType<typeof setTimeout> | null = null;
        if (req.connectTimeout) {
            const abort = axios.CancelToken.source();
            if (abort) {
                id = setTimeout(() => abort.cancel("timeout"), req.connectTimeout);
                // eslint-disable-next-line
                axiosRequest.cancelToken = abort.token;
            }
        }

        const promised = axios.request(axiosRequest); // eslint-disable-line
        if (promised == null) throw new Error(`mocking error on: ${JSON.stringify(req)}`);
        return promised
            .finally(() => {
                if (id) {
                    clearTimeout(id);
                }
            })
            .then((response) => {
                debug.log(`portal reply: ${JSON.stringify(response.data)}`);
                if (response.status == null) {
                    throw new Error("query error, no data");
                }
                return response.data as V;
            })
            .catch((error: AxiosError) => {
                if (error && error.response) {
                    if (error.response.status === 401) {
                        return this.tryRefreshToken<Q, V>(req);
                    }
                    debug.log(req.url, "portal error", error.response.status, error.response.data);
                }
                debug.log(req.url, `portal error:`, error);
                throw error;
            });
    }

    private async tryRefreshToken<Q, V>(original: QueryFields<Q>): Promise<V> {
        const token = this.parseToken(this.getCurrentToken());
        if (token == null) {
            debug.log(`try-refresh: no token`);
            return Promise.reject(new AuthenticationError("no token"));
        }

        if (original.refreshed === true) {
            debug.log("try-refresh: refresh failed, clear token");
            return this.logout().then(() => Promise.reject(new AuthenticationError("refresh token failed")));
        }

        const requestBody = {
            refreshToken: token.refresh_token, // eslint-disable-line
        };

        debug.log(`refreshing token`);

        const baseUri = await this.getUri();

        return axios
            .request({
                method: "POST",
                url: baseUri + "/refresh",
                data: requestBody,
            })
            .then((response: AxiosResponse) => {
                return this.handleTokenResponse<V>(response).then((self) => {
                    debug.log("retrying", original.url);
                    return this.query<Q, V>(_.extend({}, original, { refreshed: true, token: self.token }));
                });
            })
            .catch((error: AxiosError) => {
                debug.log("refresh failed", error);
                return this.logout().then(() => {
                    return Promise.reject(error);
                });
            });
    }

    private parseToken(token: string | null): { refresh_token: string } | null {
        try {
            if (!token) return null;
            const encoded = token.split(".")[1];
            const decoded = Buffer.from(encoded, "base64").toString();
            return JSON.parse(decoded) as { refresh_token: string };
        } catch (e) {
            debug.log("error parsing token", e, "token", token);
            return null;
        }
    }

    private handleError(error: Error): never {
        debug.log(`portal-error:`, error);
        throw error;
    }
}
