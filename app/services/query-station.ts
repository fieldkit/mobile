import _ from "lodash";
import Config from "@/config";
import { unixNow, promiseAfter } from "@/utilities";
import { Services } from "@/services/interface";
import { Conservify, HttpResponse } from "@/wrappers/networking";
import { QueryThrottledError, StationQueryError, HttpError } from "@/lib/errors";
import { PhoneLocation, Schedules, NetworkInfo, LoraSettings } from "@/store/types";
import { prepareReply, SerializedStatus, HttpStatusReply } from "@/store/http-types";
import { fk_app } from "fk-app-protocol/fk-app";

const HttpQuery = fk_app.HttpQuery;
const HttpReply = fk_app.HttpReply;
const QueryType = fk_app.QueryType;
const ReplyType = fk_app.ReplyType;

export type ProgressCallback = (total: number, bytes: number, info: any) => void;

export class CalculatedSize {
    constructor(public readonly size: number) {}
}

export interface TrackActivityOptions {
    url: string;
    throttle: boolean;
}

export interface QueryOptions {
    url?: string;
    throttle?: boolean;
}

const log = Config.logger("QueryStation");

type StationQuery = { reply: fk_app.HttpReply; serialized: SerializedStatus };

export default class QueryStation {
    private readonly conservify: Conservify;
    private readonly openQueries: { [index: string]: boolean } = {};
    private readonly lastQueries: { [index: string]: Date } = {};
    private readonly lastQueryTried: { [index: string]: Date } = {};

    constructor(services: Services) {
        this.conservify = services.Conservify();
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

    public takeReadings(address: string, locate: PhoneLocation, options: QueryOptions = {}): Promise<HttpStatusReply> {
        const message = this.buildLocateMessage(QueryType.QUERY_TAKE_READINGS, locate);
        return this.stationQuery(address, message, options).then((reply) => {
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

    public configureSchedule(address: string, schedules: Schedules): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            schedules: { modifying: true, ...schedules },
            time: unixNow(),
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public sendNetworkSettings(address: string, networks: NetworkInfo[]): Promise<HttpStatusReply> {
        const message = HttpQuery.create({
            type: QueryType.QUERY_CONFIGURE,
            networkSettings: { networks: networks },
        });

        return this.stationQuery(address, message).then((reply) => {
            return this.fixupStatus(reply);
        });
    }

    public sendLoraSettings(address: string, lora: LoraSettings): Promise<HttpStatusReply> {
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
            return this.conservify
                .json({
                    method: "HEAD",
                    url: url,
                })
                .then(
                    (response: HttpResponse) => {
                        if (response.statusCode != 204) {
                            console.log("http-status", response.statusCode, response.headers);
                            return Promise.reject(new HttpError("status", response));
                        }

                        let size = 0;
                        if (response.headers["fk-bytes"]) {
                            size = Number(response.headers["fk-bytes"]);
                        }
                        if (response.headers["content-length"]) {
                            size = Number(response.headers["content-length"]);
                        }

                        console.log("size", size, response.headers);
                        return new CalculatedSize(size);
                    },
                    (err: Error | undefined) => {
                        console.log(url, "query error", err!.message);
                        return Promise.reject(err);
                    }
                );
        });
    }

    public queryLogs(url: string): Promise<string> {
        return this.trackActivityAndThrottle(url, () => {
            return this.conservify
                .text({
                    url: url + "/download/logs",
                })
                .then(
                    (response: HttpResponse): string => {
                        return response.body;
                    },
                    (err) => {
                        console.log(url, "query error", err.message);
                        return Promise.reject(err);
                    }
                );
        });
    }

    public download(url: string, path: string, progress: ProgressCallback): Promise<HttpResponse> {
        return this.trackActivity({ url: url, throttle: false }, () => {
            return this.conservify
                .download({
                    method: "GET",
                    url: url,
                    path: path,
                    progress: progress,
                })
                .then((response: HttpResponse) => {
                    // log.info("headers", response.headers);
                    // log.info("status", response.statusCode);
                    if (response.statusCode != 200) {
                        return Promise.reject(response);
                    }
                    return response;
                });
        });
    }

    public uploadFirmware(url: string, path: string, progress: ProgressCallback): Promise<void> {
        return this.trackActivity({ url: url, throttle: false }, () => {
            return this.conservify
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

    public uploadViaApp(address: string): Promise<void> {
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

        return this.stationQuery(address, message)
            .then((reply) => {
                return this.fixupStatus(reply);
            })
            .then(() => Promise.resolve());
    }

    public uploadOverWifi(address: string, transmissionUrl: string, transmissionToken: string): Promise<void> {
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

        return this.stationQuery(address, message)
            .then((reply) => {
                return this.fixupStatus(reply);
            })
            .then(() => Promise.resolve());
    }

    private urlToStationKey(url: string): string {
        if (!url) throw new Error("no station url");
        // http://192.168.0.100:2380/fk/v1 -> http://192.168.0.100:2380/fk
        return url.replace(/\/v1.*/, "");
    }

    private readonly queued: { [index: string]: any } = {};

    private trackActivity<T>(options: TrackActivityOptions, factory: () => Promise<T>): Promise<T> {
        const stationKey = this.urlToStationKey(options.url);
        if (this.openQueries[stationKey] === true) {
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
        this.openQueries[stationKey] = true;
        this.lastQueryTried[stationKey] = new Date();

        return factory()
            .then(
                (value: T) => {
                    this.openQueries[stationKey] = false;
                    this.lastQueries[stationKey] = new Date();
                    return value;
                },
                (error) => {
                    this.openQueries[stationKey] = false;
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

    private trackActivityAndThrottle<T>(url: string, factory): Promise<T> {
        return this.trackActivity<T>({ url: url, throttle: true }, factory);
    }

    /**
     * Perform a single station query, setting all the critical defaults for the
     * HTTP request and handling any necessary translations/conversations for
     * request/response bodies.
     */
    private stationQuery(url: string, message: any, options: QueryOptions = {}): Promise<StationQuery> {
        const finalOptions = _.extend({ url: url, throttle: true }, options);
        return this.trackActivity(finalOptions, () => {
            if (!Config.developer.stationFilter(url)) {
                return Promise.reject(new StationQueryError("ignored"));
            }

            const binaryQuery = HttpQuery.encodeDelimited(message).finish();
            log.info(url, "querying", JSON.stringify(message));

            return this.conservify
                .protobuf({
                    method: "POST",
                    url: url,
                    body: binaryQuery as any,
                    connectionTimeout: 3,
                })
                .then(
                    (response) => response,
                    (err) => {
                        console.log(url, "query error", err.message);
                        return Promise.reject(err);
                    }
                );
        }).then((response: { body: string }) => {
            if (response.body.length == 0) {
                console.log(`empty station reply`, response);
                throw new Error(`empty station reply`);
            }

            const decoded = this.getResponseBody(response);
            return this.handlePotentialBusyReply(decoded, url, message).then((finalReply) => {
                log.verbose(url, "query success", finalReply);
                return finalReply;
            });
        });
    }

    private getResponseBody(response: { body: any }): StationQuery {
        if (Buffer.isBuffer(response.body)) {
            return {
                reply: HttpReply.decodeDelimited(response.body),
                serialized: response.body.toString("base64"),
            };
        }
        return response.body;
    }

    private fixupStatus(stationQuery: StationQuery): HttpStatusReply {
        try {
            return prepareReply(stationQuery.reply, stationQuery.serialized);
        } catch (error) {
            console.log(`fixup-status`, error);
            throw error;
        }
    }

    private handlePotentialBusyReply(stationQuery: StationQuery, url: string, message: string): Promise<StationQuery> {
        const reply = stationQuery.reply;
        if (reply.type != ReplyType.REPLY_BUSY) {
            return Promise.resolve(stationQuery);
        }
        const delays = _.sumBy(reply.errors, "delay");
        if (delays == 0) {
            return Promise.reject(new StationQueryError("busy"));
        }
        return this.retryAfter(delays, url, message);
    }

    private retryAfter(delays: number, url: string, message: string): Promise<StationQuery> {
        log.info(url, "retrying after", delays);
        return promiseAfter(delays).then(() => {
            return this.stationQuery(url, message);
        });
    }
}
