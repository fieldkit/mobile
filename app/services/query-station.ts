import _ from "lodash";
import Config from "@/config";
import { unixNow, promiseAfter } from "@/utilities";
import { Services, Conservify } from "@/services";
import { QueryThrottledError, StationQueryError, HttpError } from "@/lib/errors";
import { PhoneLocation } from "@/store/types";
import { prepareReply, HttpStatusReply } from "@/store/http_reply";
import { fk_app } from "fk-app-protocol/fk-app";

const HttpQuery = fk_app.HttpQuery;
const HttpReply = fk_app.HttpReply;
const QueryType = fk_app.QueryType;
const ReplyType = fk_app.ReplyType;

export class CalculatedSize {
    constructor(public readonly size: number) {}
}

export interface TrackActivityOptions {
    url: string;
    throttle: boolean;
}

const log = Config.logger("QueryStation");

export default class QueryStation {
    private readonly _conservify: Conservify;
    private readonly _openQueries: any = {};
    private readonly _lastQueries: any = {};
    private readonly _lastQueryTried: any = {};

    constructor(services: Services) {
        this._conservify = services.Conservify();
    }

    private buildLocateMessage(queryType: number, locate: PhoneLocation | null): fk_app.HttpQuery {
        if (locate) {
            return HttpQuery.create({
                type: queryType,
                time: unixNow(),
                locate: {
                    modifying: true,
                    longitude: locate.longitude,
                    latitude: locate.latitude,
                    time: locate.time,
                },
            });
        } else {
            return HttpQuery.create({
                type: queryType,
                time: unixNow(),
            });
        }
    }

    public getStatus(address: string, locate: PhoneLocation | null = null): Promise<HttpStatusReply> {
        const message = this.buildLocateMessage(QueryType.QUERY_STATUS, locate);
        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public takeReadings(address: string, locate: PhoneLocation): Promise<HttpStatusReply> {
        const message = this.buildLocateMessage(QueryType.QUERY_TAKE_READINGS, locate);
        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public startDataRecording(address: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: true },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public stopDataRecording(address: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_RECORDING_CONTROL,
            recording: { modifying: true, enabled: false },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public scanNearbyNetworks(address: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_SCAN_NETWORKS,
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public configureSchedule(address: string, schedule): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            schedules: { modifying: true, ...schedule },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public sendNetworkSettings(address: string, networks): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            networkSettings: { networks: networks },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public sendLoraSettings(address: string, lora): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            loraSettings: { appEui: lora.appEui, appKey: lora.appKey },
        });
        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public configureName(address: string, name: string): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            identity: { name: name },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public calculateDownloadSize(url: string): Promise<CalculatedSize> {
        if (!Config.developer.stationFilter(url)) {
            return Promise.reject(new StationQueryError("ignored"));
        }

        return this.trackActivity({ url: url, throttle: false }, () => {
            return this._conservify
                .json({
                    method: "HEAD",
                    url: url,
                })
                .then(
                    (response) => {
                        if (response.statusCode != 204) {
                            console.log("http-status", response.statusCode, response.headers);
                            return Promise.reject(new HttpError("status", response));
                        }

                        let size: number = 0;
                        if (response.headers["fk-bytes"]) {
                            size = Number(response.headers["fk-bytes"]);
                        }
                        if (response.headers["content-length"]) {
                            size = Number(response.headers["content-length"]);
                        }

                        console.log("size", size, response.headers);
                        return new CalculatedSize(size);
                    },
                    (err) => {
                        console.log(url, "query error", err.message);
                        return Promise.reject(err);
                    }
                );
        });
    }

    public queryLogs(url: string) {
        return this.trackActivityAndThrottle(url, () => {
            return this._conservify
                .text({
                    url: url + "/download/logs",
                })
                .then(
                    (response) => {
                        return response.body;
                    },
                    (err) => {
                        console.log(url, "query error", err.message);
                        return Promise.reject(err);
                    }
                );
        });
    }

    public download(url: string, path: string, progress) {
        return this.trackActivity({ url: url, throttle: false }, () => {
            return this._conservify
                .download({
                    method: "GET",
                    url: url,
                    path: path,
                    progress: progress,
                })
                .then((response) => {
                    // log.info("headers", response.headers);
                    // log.info("status", response.statusCode);
                    if (response.statusCode != 200) {
                        return Promise.reject(response);
                    }
                    return response;
                });
        });
    }

    public uploadFirmware(url: string, path: string, progress) {
        return this.trackActivity({ url: url, throttle: false }, () => {
            return this._conservify
                .upload({
                    method: "POST",
                    url: url + "/upload/firmware?swap=1",
                    path: path,
                    progress: progress,
                })
                .then((response) => {
                    const body = JSON.parse(response.body);
                    console.log("upload-firmware:", body);
                    return body;
                });
        });
    }

    public uploadViaApp(address: string) {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            transmission: {
                wifi: {
                    modifying: true,
                    enabled: false,
                },
            },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public uploadOverWifi(address: string, transmissionUrl: string, transmissionToken: string) {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            transmission: {
                wifi: {
                    modifying: true,
                    url: transmissionUrl,
                    token: transmissionToken,
                    enabled: true,
                },
            },
            schedules: { modifying: true, network: { duration: 0xffffffff } },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    private urlToStationKey(url: string) {
        if (!url) throw new Error("no station url");
        // http://192.168.0.100:2380/fk/v1 -> http://192.168.0.100:2380/fk
        return url.replace(/\/v1.*/, "");
    }

    private readonly queued: { [index: string]: any } = {};

    private trackActivity(options: TrackActivityOptions, factory) {
        const stationKey = this.urlToStationKey(options.url);
        if (this._openQueries[stationKey] === true) {
            if (options.throttle) {
                console.log(options.url, "throttle");
                return Promise.reject(new QueryThrottledError("throttled"));
            }
            return new Promise((resolve) => {
                console.log(options.url, "queuing station query");
                this.queued[stationKey] = resolve;
            }).then(() => {
                return this.trackActivity(options, factory);
            });
        }
        this._openQueries[stationKey] = true;
        this._lastQueryTried[stationKey] = new Date();

        return factory()
            .then(
                (value) => {
                    this._openQueries[stationKey] = false;
                    this._lastQueries[stationKey] = new Date();
                    return value;
                },
                (error) => {
                    this._openQueries[stationKey] = false;
                    return Promise.reject(error);
                }
            )
            .finally(() => {
                if (this.queued[stationKey]) {
                    console.log("resuming");
                    const resume = this.queued[stationKey];
                    delete this.queued[stationKey];
                    resume();
                }
            });
    }

    private trackActivityAndThrottle(url: string, factory) {
        return this.trackActivity({ url: url, throttle: true }, factory);
    }

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    private stationQuery(url: string, message) {
        return this.trackActivityAndThrottle(url, () => {
            if (!Config.developer.stationFilter(url)) {
                return Promise.reject(new StationQueryError("ignored"));
            }

            const binaryQuery = HttpQuery.encodeDelimited(message).finish();
            log.info(url, "querying", JSON.stringify(message));

            return this._conservify
                .protobuf({
                    method: "POST",
                    url: url,
                    body: binaryQuery as any,
                    connectionTimeout: 3,
                })
                .then(
                    (response) => response,
                    (err) => {
                        if (false) {
                            console.log(url, "query error", err, err ? err.stack : null);
                        } else {
                            console.log(url, "query error", err.message);
                        }
                        return Promise.reject(err);
                    }
                );
        }).then((response) => {
            if (response.body.length == 0) {
                log.info(url, "query success", "<empty>");
                return {};
            }

            const decoded = this.getResponseBody(response);
            return this.handlePotentialBusyReply(decoded, url, message).then((finalReply) => {
                log.verbose(url, "query success", finalReply);
                return finalReply;
            });
        });
    }

    private getResponseBody(response): HttpStatusReply {
        if (Buffer.isBuffer(response.body)) {
            const decoded: any = HttpReply.decodeDelimited(response.body);
            decoded.serialized = response.body.toString("base64");
            return decoded as HttpStatusReply;
        }
        return response.body;
    }

    private fixupStatus(reply): HttpStatusReply {
        return prepareReply(reply);
    }

    private handlePotentialBusyReply(reply: HttpStatusReply, url: string, message: string): Promise<HttpStatusReply> {
        if (reply.type != ReplyType.REPLY_BUSY) {
            return Promise.resolve(reply);
        }
        const delays = _.sumBy(reply.errors, "delay");
        if (delays == 0) {
            return Promise.reject(new StationQueryError("busy"));
        }
        return this.retryAfter(delays, url, message);
    }

    private retryAfter(delays: number, url: string, message: string): Promise<HttpStatusReply> {
        log.info(url, "retrying after", delays);
        return promiseAfter(delays).then(() => {
            return this.stationQuery(url, message);
        });
    }
}
